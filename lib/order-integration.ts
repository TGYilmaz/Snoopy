// lib/order-integration.ts
import { supabase } from './supabase';
import type { OrderItem } from './pos-types';

/**
 * Sipariş oluşturulduğunda stok ve cari işlemlerini yönetir
 */
export async function processOrderWithIntegration({
  orderId,
  items,
  totalAmount,
  paymentMethod,
  accountId,
  isCredit,
}: {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mixed' | 'credit';
  accountId?: string;
  isCredit?: boolean;
}) {
  console.log('🔄 Entegrasyon başlıyor:', { orderId, itemsCount: items.length, totalAmount, isCredit });

  try {
    const { stockMovementService, recipeService, accountTransactionService } = await import('./supabase-services');

    // 1. STOK VE REÇETE İŞLEMLERİ
    for (const item of items) {
      // Menü kontrolü
      if (item.isMenu) {
        console.log('⏭️  Menü atlandı:', item.productName);
        continue;
      }

      console.log('📦 İşleniyor:', item.productName, 'ID:', item.productId);

      try {
        // Stocks tablosunda bu ürün var mı kontrol et
        const { data: stockExists, error: stockCheckError } = await supabase
          .from('stocks')
          .select('id, name, current_quantity')
          .eq('id', item.productId)
          .maybeSingle();

        if (stockCheckError) {
          console.error('❌ Stok kontrolü hatası:', stockCheckError);
        }

        // Reçete var mı kontrol et
        console.log('🔍 Reçete kontrol ediliyor:', item.productId);
        const recipe = await recipeService.getByProductId(item.productId);

        if (recipe && recipe.recipe_items && recipe.recipe_items.length > 0) {
          console.log('🧾 Reçete bulundu, hammaddeler düşülüyor:', recipe.name);
          console.log('📋 Hammadde sayısı:', recipe.recipe_items.length);

          await recipeService.processRecipe(item.productId, item.quantity, orderId);
          console.log('✅ Reçete işlendi');
          continue; // Reçete işlendiyse direkt stok düşürme yapma
        }

        // Reçete yoksa ve stocks'ta varsa direkt stok düş
        if (stockExists) {
          console.log('✅ Stok bulundu:', stockExists.name, 'Mevcut:', stockExists.current_quantity);
          console.log('📉 Direkt stok düşümü yapılıyor');

          const movement = await stockMovementService.create({
            stock_id: item.productId,
            movement_type: 'sale',
            quantity: item.quantity,
            unit_price: item.unitPrice,
            reference_type: 'order',
            reference_id: orderId,
            notes: 'Satış',
          });
          console.log('✅ Stok hareketi oluşturuldu:', movement.id);
        } else {
          console.log('⚠️  Ürün stocks tablosunda yok ve reçetesi de yok, atlanıyor:', item.productName);
        }
      } catch (itemError) {
        console.error('❌ Ürün işleme hatası:', item.productName, itemError);
      }
    } // ← for döngüsü burada kapatılıyor

    // 2. CARİ HESAP İŞLEMLERİ (döngünün dışında, bir kez çalışır)
    if (accountId) {
      console.log('👤 Cari hesap işlemi yapılıyor:', accountId);

      try {
        if (isCredit) {
          // VERESİYE SATIŞ
          await accountTransactionService.create({
            account_id: accountId,
            transaction_type: 'sale',
            amount: -totalAmount, // NEGATİF! Müşteri bize borçlu
            payment_method: 'credit',
            reference_type: 'order',
            reference_id: orderId,
            description: `Veresiye satış - Sipariş #${orderId.substring(0, 8)}`,
          });
          console.log('✅ Veresiye satış kaydı oluşturuldu');
        } else {
          // NORMAL SATIŞ (Nakit/Kart)
          // Önce satış kaydı (borç)
          await accountTransactionService.create({
            account_id: accountId,
            transaction_type: 'sale',
            amount: -totalAmount, // NEGATİF - borç
            payment_method: paymentMethod,
            reference_type: 'order',
            reference_id: orderId,
            description: `Satış - Sipariş #${orderId.substring(0, 8)}`,
          });
          console.log('✅ Satış kaydı oluşturuldu');

          // Sonra tahsilat kaydı (alacak - borcu kapatıyor)
          await accountTransactionService.create({
            account_id: accountId,
            transaction_type: 'receipt',
            amount: totalAmount, // POZİTİF - tahsilat
            payment_method: paymentMethod,
            reference_type: 'order',
            reference_id: orderId,
            description: `Tahsilat - Sipariş #${orderId.substring(0, 8)}`,
          });
          console.log('✅ Tahsilat kaydı oluşturuldu');
        }
      } catch (accountError) {
        console.error('❌ Cari hesap işleme hatası:', accountError);
      }
    }

    console.log('✅ Entegrasyon tamamlandı');
    return { success: true };
  } catch (error) {
    console.error('❌ Sipariş entegrasyonu hatası:', error);
    return { success: false, error };
  }
}

/**
 * Sipariş oluşturmadan önce stok kontrolü yapar
 */
export async function checkStockAvailability(items: OrderItem[]) {
  console.log('🔍 Stok kontrolü başlıyor:', items.length, 'ürün');

  try {
    const { recipeService } = await import('./supabase-services');

    const unavailableItems: Array<{
      product_id: string;
      product_name: string;
      requested: number;
      available: number;
    }> = [];

    for (const item of items) {
      if (item.isMenu) {
        console.log('⏭️  Menü atlandı:', item.productName);
        continue;
      }

      try {
        console.log('🔍 Kontrol ediliyor:', item.productName);

        // Önce reçete kontrol et
        const recipe = await recipeService.getByProductId(item.productId);

        if (recipe && recipe.recipe_items && recipe.recipe_items.length > 0) {
          // Reçeteli ürün - hammadde kontrolü
          console.log('🧾 Reçete bulundu:', recipe.name, '- Hammaddeler kontrol ediliyor');

          for (const recipeItem of recipe.recipe_items) {
            const requiredQuantity = recipeItem.quantity * item.quantity;

            const { data: material } = await supabase
              .from('stocks')
              .select('*')
              .eq('id', recipeItem.material_id)
              .maybeSingle();

            if (material) {
              console.log('  📦 Hammadde:', material.name, 'Mevcut:', material.current_quantity, 'Gerekli:', requiredQuantity);

              if (material.current_quantity < requiredQuantity) {
                console.log('  ❌ Yetersiz!');
                unavailableItems.push({
                  product_id: recipeItem.material_id,
                  product_name: `${material.name} (${item.productName} için gerekli)`,
                  requested: requiredQuantity,
                  available: material.current_quantity,
                });
              } else {
                console.log('  ✅ Yeterli');
              }
            }
          }
          continue; // Reçete kontrol edildiyse stocks kontrolü yapma
        }

        // Reçete yoksa stocks'ta kontrol et
        const { data: stock, error } = await supabase
          .from('stocks')
          .select('id, name, current_quantity, category')
          .eq('id', item.productId)
          .maybeSingle();

        if (error || !stock) {
          console.log('⚠️  Ürün stocks tablosunda yok ve reçetesi de yok, stok kontrolü atlanıyor:', item.productName);
          continue;
        }

        console.log('📦 Stok kontrol:', stock.name, 'Mevcut:', stock.current_quantity, 'İstenen:', item.quantity);

        if (stock.current_quantity < item.quantity) {
          console.log('❌ Yetersiz stok:', stock.name);
          unavailableItems.push({
            product_id: item.productId,
            product_name: stock.name,
            requested: item.quantity,
            available: stock.current_quantity,
          });
        } else {
          console.log('✅ Yeterli');
        }
      } catch (itemError) {
        console.error('❌ Ürün kontrolü hatası:', item.productName, itemError);
      }
    }

    const result = {
      available: unavailableItems.length === 0,
      unavailableItems,
    };

    console.log('✅ Stok kontrolü tamamlandı:', result.available ? 'YETERLİ' : 'YETERSİZ');
    return result;
  } catch (error) {
    console.error('❌ Stok kontrolü genel hatası:', error);
    return {
      available: true,
      unavailableItems: [],
    };
  }
}

// ... checkCreditLimit ve reverseOrderIntegration fonksiyonları aynı kalacak
