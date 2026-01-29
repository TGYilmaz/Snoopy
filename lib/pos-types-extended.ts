// lib/pos-types-extended.ts
// Mevcut pos-types.ts dosyanıza eklenecek tipler

// ============================================
// STOK YÖNETİMİ TİPLERİ
// ============================================

export type StockCategory = 'raw_material' | 'semi_finished' | 'finished_product';
export type StockUnit = 'piece' | 'kg' | 'gr' | 'liter' | 'ml' | 'box' | 'package';
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'purchase' | 'production';

export interface Stock {
  id: string;
  name: string;
  category: StockCategory;
  unit: StockUnit;
  current_quantity: number;
  minimum_quantity: number;
  cost_price: number;
  sell_price: number;
  barcode?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  stock_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_price?: number;
  reference_type?: string; // 'order', 'purchase', 'production', 'manual'
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  // İlişkili veri
  stock?: Stock;
}

export interface LowStockItem {
  id: string;
  name: string;
  category: StockCategory;
  current_quantity: number;
  minimum_quantity: number;
  unit: StockUnit;
  shortage: number;
}

// ============================================
// REÇETE YÖNETİMİ TİPLERİ
// ============================================

export interface Recipe {
  id: string;
  product_id: string;
  name: string;
  output_quantity: number;
  output_unit: StockUnit;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // İlişkili veri
  product?: Stock;
  recipe_items?: RecipeItem[];
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  material_id: string;
  quantity: number;
  unit: StockUnit;
  notes?: string;
  created_at: string;
  // İlişkili veri
  material?: Stock;
}

// ============================================
// CARİ HESAP YÖNETİMİ TİPLERİ
// ============================================

export type AccountType = 'customer' | 'supplier' | 'both';
export type TransactionType = 'sale' | 'purchase' | 'payment' | 'receipt' | 'adjustment';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'credit';

export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  credit_limit: number;
  balance: number; // (+) alacak, (-) borç
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountTransaction {
  id: string;
  account_id: string;
  transaction_type: TransactionType;
  amount: number;
  payment_method?: PaymentMethod;
  reference_type?: string; // 'order', 'invoice', 'payment'
  reference_id?: string;
  description?: string;
  created_by?: string;
  created_at: string;
  // İlişkili veri
  account?: Account;
}

export interface AccountSummary {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  balance: number;
  transaction_count: number;
  last_transaction_date?: string;
}

// ============================================
// GENİŞLETİLMİŞ SİPARİŞ TİPLERİ
// ============================================

// Mevcut Order tipinize bu alanları ekleyin
export interface ExtendedOrder {
  account_id?: string;
  is_credit: boolean; // Veresiye mi?
  account?: Account;
}

// ============================================
// FORM TİPLERİ
// ============================================

export interface CreateStockInput {
  name: string;
  category: StockCategory;
  unit: StockUnit;
  current_quantity: number;
  minimum_quantity: number;
  cost_price: number;
  sell_price: number;
  barcode?: string;
  description?: string;
}

export interface CreateStockMovementInput {
  stock_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

export interface CreateRecipeInput {
  product_id: string;
  name: string;
  output_quantity: number;
  output_unit: StockUnit;
  items: {
    material_id: string;
    quantity: number;
    unit: StockUnit;
  }[];
}

export interface CreateAccountInput {
  code: string;
  name: string;
  account_type: AccountType;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  credit_limit: number;
}

export interface CreateAccountTransactionInput {
  account_id: string;
  transaction_type: TransactionType;
  amount: number;
  payment_method?: PaymentMethod;
  description?: string;
}

// ============================================
// YARDIMCI TİPLER VE SABITLER
// ============================================

export const STOCK_CATEGORY_LABELS: Record<StockCategory, string> = {
  raw_material: 'Hammadde',
  semi_finished: 'Yarı Mamul',
  finished_product: 'Mamul',
};

export const STOCK_UNIT_LABELS: Record<StockUnit, string> = {
  piece: 'Adet',
  kg: 'Kilogram',
  gr: 'Gram',
  liter: 'Litre',
  ml: 'Mililitre',
  box: 'Kutu',
  package: 'Paket',
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  adjustment: 'Düzeltme',
  sale: 'Satış',
  purchase: 'Alış',
  production: 'Üretim',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  customer: 'Müşteri',
  supplier: 'Tedarikçi',
  both: 'Her İkisi',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Satış',
  purchase: 'Alış',
  payment: 'Ödeme',
  receipt: 'Tahsilat',
  adjustment: 'Düzeltme',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Nakit',
  card: 'Kredi Kartı',
  transfer: 'Havale/EFT',
  check: 'Çek',
  credit: 'Veresiye',
};
