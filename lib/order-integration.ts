// lib/order-integration.ts
// Mevcut sipariş sisteminize eklenecek entegrasyon fonksiyonları

import { supabase } from './supabase';
import {
  stockMovementService,
  recipeService,
  accountTransactionService,
} from './supabase-services';
import { OrderItem } from './pos-types';

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
    // 1. STOK VE REÇETE İŞLEMLERİ
    for (const item of items) {
      // Menü kontrolü - menüleri atla
      if (item.isMenu) {
        continue;
      }

      // Reçete varsa hammaddeleri düş
      const recipe = await recipeService.getByProductId(item.productId);
      
      if (recipe && recipe.recipe_items) {
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
    }

    // 2. CARİ HESAP İŞLEMLERİ
    if (accountId) {
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
    }

    return { success: true };
  } catch (error) {
    console.error('Sipariş entegrasyonu hatası:', error);
    throw error;
  }
}

/**
 * Sipariş oluşturmadan önce stok kontrolü yapar
 */
export async function checkStockAvailability(items: OrderItem[]) {
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

    // Önce reçete kontrolü
    const recipe = await recipeService.getByProductId(item.productId);
    
    if (recipe && recipe.recipe_items) {
      // Reçeteli ürün - hammadde kontrolü
      for (const recipeItem of recipe.recipe_items) {
        const requiredQuantity = recipeItem.quantity * item.quantity;
        
        const { data: stock } = await supabase
          .from('stocks')
          .select('*')
          .eq('id', recipeItem.material_id)
          .single();

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
      const { data: stock } = await supabase
        .from('stocks')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (stock && stock.current_quantity < item.quantity) {
        unavailableItems.push({
          product_id: item.productId,
          product_name: stock.name || item.productName,
          requested: item.quantity,
          available: stock.current_quantity,
        });
      }
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  };
}

/**
 * Cari hesap kredi limiti kontrolü
 */
export async function checkCreditLimit(accountId: string, amount: number) {
  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (!account) {
    throw new Error('Cari hesap bulunamadı');
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
}

/**
 * Sipariş iptal edildiğinde stok ve cari işlemlerini geri alır
 */
export async function reverseOrderIntegration(orderId: string) {
  try {
    // 1. Stok hareketlerini geri al
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('reference_type', 'order')
      .eq('reference_id', orderId);

    if (movements) {
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

    if (transactions) {
      for (const transaction of transactions) {
        // Ters hareket oluştur
        await accountTransactionService.create({
          account_id: transaction.account_id,
          transaction_type: transaction.transaction_type === 'sale' ? 'adjustment' : 'adjustment',
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
    throw error;
  }
}
