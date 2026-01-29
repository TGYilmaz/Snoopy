// lib/supabase-services.ts
// Supabase CRUD işlemleri için servis fonksiyonları

import { supabase } from './supabase';
import type {
  Stock,
  StockMovement,
  Recipe,
  RecipeItem,
  Account,
  AccountTransaction,
  CreateStockInput,
  CreateStockMovementInput,
  CreateRecipeInput,
  CreateAccountInput,
  CreateAccountTransactionInput,
  LowStockItem,
  AccountSummary,
} from './pos-types-extended';

// ============================================
// STOK YÖNETİMİ SERVİSLERİ
// ============================================

export const stockService = {
  // Tüm stokları getir
  async getAll(category?: string) {
    let query = supabase
      .from('stocks')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Stock[];
  },

  // Tek stok getir
  async getById(id: string) {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Stock;
  },

  // Barkod ile stok bul
  async getByBarcode(barcode: string) {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data as Stock;
  },

  // Yeni stok ekle
  async create(input: CreateStockInput) {
    const { data, error } = await supabase
      .from('stocks')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data as Stock;
  },

  // Stok güncelle
  async update(id: string, updates: Partial<Stock>) {
    const { data, error } = await supabase
      .from('stocks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Stock;
  },

  // Stok sil (soft delete)
  async delete(id: string) {
    const { error } = await supabase
      .from('stocks')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Kritik stok seviyesindeki ürünler
  async getLowStockItems() {
    const { data, error } = await supabase
      .from('low_stock_items')
      .select('*');

    if (error) throw error;
    return data as LowStockItem[];
  },
};

// ============================================
// STOK HAREKETLERİ SERVİSLERİ
// ============================================

export const stockMovementService = {
  // Tüm hareketleri getir
  async getAll(stockId?: string, limit = 100) {
    let query = supabase
      .from('stock_movements')
      .select('*, stock:stocks(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (stockId) {
      query = query.eq('stock_id', stockId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as StockMovement[];
  },

  // Yeni hareket ekle
  async create(input: CreateStockMovementInput) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([input])
      .select('*, stock:stocks(*)')
      .single();

    if (error) throw error;
    return data as StockMovement;
  },

  // Toplu hareket ekle (reçete için)
  async createBulk(movements: CreateStockMovementInput[]) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movements)
      .select('*, stock:stocks(*)');

    if (error) throw error;
    return data as StockMovement[];
  },
};

// ============================================
// REÇETE YÖNETİMİ SERVİSLERİ
// ============================================

export const recipeService = {
  // Tüm reçeteleri getir
  async getAll() {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        product:stocks!recipes_product_id_fkey(*),
        recipe_items(
          *,
          material:stocks!recipe_items_material_id_fkey(*)
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as Recipe[];
  },

  // Ürüne göre reçete getir
  async getByProductId(productId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        product:stocks!recipes_product_id_fkey(*),
        recipe_items(
          *,
          material:stocks!recipe_items_material_id_fkey(*)
        )
      `)
      .eq('product_id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Reçete bulunamadı
      throw error;
    }
    return data as Recipe;
  },

  // Yeni reçete oluştur
  async create(input: CreateRecipeInput) {
    // Önce reçeteyi oluştur
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([{
        product_id: input.product_id,
        name: input.name,
        output_quantity: input.output_quantity,
        output_unit: input.output_unit,
      }])
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Sonra malzemeleri ekle
    const items = input.items.map(item => ({
      recipe_id: recipe.id,
      material_id: item.material_id,
      quantity: item.quantity,
      unit: item.unit,
    }));

    const { error: itemsError } = await supabase
      .from('recipe_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return recipe as Recipe;
  },

  // Reçete güncelle
  async update(id: string, input: CreateRecipeInput) {
    // Önce reçeteyi güncelle
    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        name: input.name,
        output_quantity: input.output_quantity,
        output_unit: input.output_unit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (recipeError) throw recipeError;

    // Eski malzemeleri sil
    const { error: deleteError } = await supabase
      .from('recipe_items')
      .delete()
      .eq('recipe_id', id);

    if (deleteError) throw deleteError;

    // Yeni malzemeleri ekle
    const items = input.items.map(item => ({
      recipe_id: id,
      material_id: item.material_id,
      quantity: item.quantity,
      unit: item.unit,
    }));

    const { error: itemsError } = await supabase
      .from('recipe_items')
      .insert(items);

    if (itemsError) throw itemsError;
  },

  // Reçete sil
  async delete(id: string) {
    const { error } = await supabase
      .from('recipes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Reçeteye göre stok düş
  async processRecipe(productId: string, quantity: number, orderId?: string) {
    // Reçeteyi getir
    const recipe = await this.getByProductId(productId);
    if (!recipe || !recipe.recipe_items) {
      throw new Error('Reçete bulunamadı');
    }

    // Her hammadde için stok hareketi oluştur
    const movements = recipe.recipe_items.map(item => ({
      stock_id: item.material_id,
      movement_type: 'sale' as const,
      quantity: item.quantity * quantity,
      reference_type: 'order',
      reference_id: orderId,
      notes: `${recipe.name} reçetesi için kullanıldı`,
    }));

    await stockMovementService.createBulk(movements);
  },
};

// ============================================
// CARİ HESAP YÖNETİMİ SERVİSLERİ
// ============================================

export const accountService = {
  // Tüm cari hesapları getir
  async getAll(accountType?: string) {
    let query = supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (accountType) {
      query = query.eq('account_type', accountType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Account[];
  },

  // Özet bilgilerle getir
  async getAllWithSummary() {
    const { data, error } = await supabase
      .from('account_summary')
      .select('*');

    if (error) throw error;
    return data as AccountSummary[];
  },

  // Tek cari hesap getir
  async getById(id: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Account;
  },

  // Kod ile cari hesap getir
  async getByCode(code: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data as Account;
  },

  // Yeni cari hesap ekle
  async create(input: CreateAccountInput) {
    const { data, error } = await supabase
      .from('accounts')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data as Account;
  },

  // Cari hesap güncelle
  async update(id: string, updates: Partial<Account>) {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Account;
  },

  // Cari hesap sil
  async delete(id: string) {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Krediye uygunluk kontrolü
  async checkCreditLimit(accountId: string, amount: number) {
    const account = await this.getById(accountId);
    const newBalance = account.balance - amount; // Borç artacak
    
    return {
      allowed: Math.abs(newBalance) <= account.credit_limit,
      currentBalance: account.balance,
      creditLimit: account.credit_limit,
      availableCredit: account.credit_limit - Math.abs(account.balance),
      newBalance,
    };
  },
};

// ============================================
// CARİ HAREKETLERİ SERVİSLERİ
// ============================================

export const accountTransactionService = {
  // Tüm hareketleri getir
  async getAll(accountId?: string, limit = 100) {
    let query = supabase
      .from('account_transactions')
      .select('*, account:accounts(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AccountTransaction[];
  },

  // Yeni hareket ekle
  async create(input: CreateAccountTransactionInput) {
    const { data, error } = await supabase
      .from('account_transactions')
      .insert([input])
      .select('*, account:accounts(*)')
      .single();

    if (error) throw error;
    return data as AccountTransaction;
  },

  // Tarih aralığına göre hareketler
  async getByDateRange(startDate: string, endDate: string, accountId?: string) {
    let query = supabase
      .from('account_transactions')
      .select('*, account:accounts(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AccountTransaction[];
  },
};
