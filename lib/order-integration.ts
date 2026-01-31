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
  try {
    // Dinamik import ile servisleri yükle
    const { stockMovementService, recipeService, accountTransactionService } = await import('./supabase-services');

    // 1. STOK VE REÇETE İŞLEMLERİ
    for (const item of items) {
      // Menü kontrolü - menüleri atla
      if (item.isMenu) {
        continue;
      }

      try {
        // Ürün ID'si ile stock var mı kontrol et
        const { data: stockExists } = await supabase
          .from('stocks')
          .select('id')
          .eq('id', item.productId)
          .maybeSingle();

        if (!stockExists) {
          console.warn(`Ürün stocks tablosunda yok: ${item.productName}`);
          continue;
        }

        // Reçete varsa hammaddeleri düş
        const recipe = await recipeService.getByProductId(item.productId);
        
        if (recipe && recipe.recipe_items && recipe.recipe_items.length > 0) {
          // Reçete bazlı stok düşümü
          await recipeService.processRecipe(
            item.productId,
            item.quantity,
            orderId
          );
        } else {
          // Direkt stok düşümü (reçete yok)
          await stockMovementService.create({
            stock_id: item.productId,
            movement_type: 'sale',
            quantity: item.quantity,
            unit_price: item.unitPrice,
            reference_type: 'order',
            reference_id: orderId,
            notes: 'Satış',
          });
        }
      } catch (itemError) {
        console.error(`Ürün işleme hatası (${item.productName}):`, itemError);
      }
    }

    // 2. CARİ HESAP İŞLEMLERİ
    if (accountId) {
      try {
        // Veresiye veya cari ile satış
        await accountTransactionService.create({
          account_id: accountId,
          transaction_type: 'sale',
          amount: totalAmount,
          payment_method: paymentMethod === 'credit' ? 'credit' : paymentMethod,
          reference_type: 'order',
          reference_id: orderId,
          description: `Sipariş #${orderId.substring(0, 8)}`,
        });

        // Eğer nakit/kart ödeme de varsa (karma durumda)
        if (!isCredit && paymentMethod !== 'credit') {
          // Tahsilat kaydı
          await accountTransactionService.create({
            account_id: accountId,
            transaction_type: 'receipt',
            amount: totalAmount,
            payment_method: paymentMethod,
            reference_type: 'order',
            reference_id: orderId,
            description: `Sipariş #${orderId.substring(0, 8)} tahsilatı`,
          });
        }
      } catch (accountError) {
        console.warn('Cari hesap işleme hatası:', accountError);
        // Hata olsa bile devam et
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Sipariş entegrasyonu hatası:', error);
    // Hata olsa bile başarılı dön (sipariş zaten kaydedildi)
    return { success: false, error };
  }
}

/**
 * Sipariş oluşturmadan önce stok kontrolü yapar
 */
export async function checkStockAvailability(items: OrderItem[]) {
  try {
    // Dinamik import
    const { recipeService } = await import('./supabase-services');

    const unavailableItems: Array<{
      product_id: string;
      product_name: string;
      requested: number;
      available: number;
    }> = [];

    for (const item of items) {
      // Menü kontrolü - menüleri atla
      if (item.isMenu) {
        continue;
      }

      try {
        // Önce reçete kontrolü
        const recipe = await recipeService.getByProductId(item.productId);
        
        if (recipe && recipe.recipe_items && recipe.recipe_items.length > 0) {
          // Reçeteli ürün - hammadde kontrolü
          for (const recipeItem of recipe.recipe_items) {
            const requiredQuantity = recipeItem.quantity * item.quantity;
            
            const { data: stock, error } = await supabase
              .from('stocks')
              .select('*')
              .eq('id', recipeItem.material_id)
              .maybeSingle();

            if (error) {
              console.warn('Stok kontrolü hatası:', error);
              continue;
            }

            if (stock && stock.current_quantity < requiredQuantity) {
              unavailableItems.push({
                product_id: recipeItem.material_id,
                product_name: `${stock.name} (${item.productName} için gerekli)`,
                requested: requiredQuantity,
                available: stock.current_quantity,
              });
            }
          }
        } else {
          // Reçetesiz ürün - direkt stok kontrolü
          const { data: stock, error } = await supabase
            .from('stocks')
            .select('*')
            .eq('id', item.productId)
            .maybeSingle();

          if (error) {
            console.warn('Stok kontrolü hatası:', error);
            continue;
          }

          if (stock && stock.current_quantity < item.quantity) {
            unavailableItems.push({
              product_id: item.productId,
              product_name: stock.name || item.productName,
              requested: item.quantity,
              available: stock.current_quantity,
            });
          }
        }
      } catch (itemError) {
        console.warn(`Ürün kontrolü hatası (${item.productName}):`, itemError);
        continue;
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems,
    };
  } catch (error) {
    console.error('Stok kontrolü genel hatası:', error);
    return {
      available: true, // Hata durumunda işleme devam et
      unavailableItems: [],
    };
  }
}

/**
 * Cari hesap kredi limiti kontrolü
 */
export async function checkCreditLimit(accountId: string, amount: number) {
  try {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error || !account) {
      console.warn('Cari hesap bulunamadı:', error);
      return {
        allowed: true, // Hesap bulunamazsa işleme izin ver
        currentBalance: 0,
        creditLimit: 0,
        availableCredit: 0,
        requiredAmount: amount,
        newBalance: -amount,
        deficit: 0,
      };
    }

    const newBalance = account.balance - amount; // Borç artacak
    const availableCredit = account.credit_limit - Math.abs(account.balance);

    return {
      allowed: Math.abs(newBalance) <= account.credit_limit,
      currentBalance: account.balance,
      creditLimit: account.credit_limit,
      availableCredit,
      requiredAmount: amount,
      newBalance,
      deficit: Math.max(0, Math.abs(newBalance) - account.credit_limit),
    };
  } catch (error) {
    console.error('Kredi limiti kontrolü hatası:', error);
    return {
      allowed: true, // Hata durumunda işleme izin ver
      currentBalance: 0,
      creditLimit: 0,
      availableCredit: 0,
      requiredAmount: amount,
      newBalance: -amount,
      deficit: 0,
    };
  }
}

/**
 * Sipariş iptal edildiğinde stok ve cari işlemlerini geri alır
 */
export async function reverseOrderIntegration(orderId: string) {
  try {
    // Dinamik import
    const { stockMovementService, accountTransactionService } = await import('./supabase-services');

    // 1. Stok hareketlerini geri al
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('reference_type', 'order')
      .eq('reference_id', orderId);

    if (movements && movements.length > 0) {
      for (const movement of movements) {
        // Ters hareket oluştur
        await stockMovementService.create({
          stock_id: movement.stock_id,
          movement_type: movement.movement_type === 'out' ? 'in' : 'out',
          quantity: movement.quantity,
          reference_type: 'order_reversal',
          reference_id: orderId,
          notes: 'Sipariş iptali',
        });
      }
    }

    // 2. Cari hareketlerini geri al
    const { data: transactions } = await supabase
      .from('account_transactions')
      .select('*')
      .eq('reference_type', 'order')
      .eq('reference_id', orderId);

    if (transactions && transactions.length > 0) {
      for (const transaction of transactions) {
        // Ters hareket oluştur
        await accountTransactionService.create({
          account_id: transaction.account_id,
          transaction_type: 'adjustment',
          amount: -transaction.amount, // Negatif tutar ile düzeltme
          reference_type: 'order_reversal',
          reference_id: orderId,
          description: 'Sipariş iptali - düzeltme',
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Sipariş geri alma hatası:', error);
    return { success: false, error };
  }
}
