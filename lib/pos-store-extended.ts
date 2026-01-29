// lib/pos-store-extended.ts
// Mevcut pos-store.ts dosyanıza eklenecek store slice'ları

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  Stock,
  StockMovement,
  Recipe,
  Account,
  AccountTransaction,
  LowStockItem,
} from './pos-types-extended';
import {
  stockService,
  stockMovementService,
  recipeService,
  accountService,
  accountTransactionService,
} from './supabase-services';

// ============================================
// STOK STORE
// ============================================

interface StockState {
  stocks: Stock[];
  lowStockItems: LowStockItem[];
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchStocks: (category?: string) => Promise<void>;
  fetchLowStockItems: () => Promise<void>;
  fetchStockMovements: (stockId?: string) => Promise<void>;
  addStock: (stock: any) => Promise<Stock>;
  updateStock: (id: string, updates: Partial<Stock>) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  addStockMovement: (movement: any) => Promise<void>;
  getStockById: (id: string) => Stock | undefined;
}

export const useStockStore = create<StockState>()(
  devtools(
    (set, get) => ({
      stocks: [],
      lowStockItems: [],
      stockMovements: [],
      loading: false,
      error: null,

      fetchStocks: async (category) => {
        set({ loading: true, error: null });
        try {
          const stocks = await stockService.getAll(category);
          set({ stocks, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchLowStockItems: async () => {
        try {
          const items = await stockService.getLowStockItems();
          set({ lowStockItems: items });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      fetchStockMovements: async (stockId) => {
        set({ loading: true, error: null });
        try {
          const movements = await stockMovementService.getAll(stockId);
          set({ stockMovements: movements, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addStock: async (stockData) => {
        set({ loading: true, error: null });
        try {
          const newStock = await stockService.create(stockData);
          set((state) => ({
            stocks: [...state.stocks, newStock],
            loading: false,
          }));
          return newStock;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateStock: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const updated = await stockService.update(id, updates);
          set((state) => ({
            stocks: state.stocks.map((s) => (s.id === id ? updated : s)),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteStock: async (id) => {
        set({ loading: true, error: null });
        try {
          await stockService.delete(id);
          set((state) => ({
            stocks: state.stocks.filter((s) => s.id !== id),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      addStockMovement: async (movementData) => {
        try {
          const movement = await stockMovementService.create(movementData);
          set((state) => ({
            stockMovements: [movement, ...state.stockMovements],
          }));
          // Stokları yeniden getir
          get().fetchStocks();
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      getStockById: (id) => {
        return get().stocks.find((s) => s.id === id);
      },
    }),
    { name: 'stock-store' }
  )
);

// ============================================
// REÇETE STORE
// ============================================

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchRecipes: () => Promise<void>;
  getRecipeByProductId: (productId: string) => Promise<Recipe | null>;
  addRecipe: (recipe: any) => Promise<void>;
  updateRecipe: (id: string, recipe: any) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  processRecipeForSale: (productId: string, quantity: number, orderId?: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>()(
  devtools(
    (set, get) => ({
      recipes: [],
      loading: false,
      error: null,

      fetchRecipes: async () => {
        set({ loading: true, error: null });
        try {
          const recipes = await recipeService.getAll();
          set({ recipes, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      getRecipeByProductId: async (productId) => {
        try {
          return await recipeService.getByProductId(productId);
        } catch (error: any) {
          set({ error: error.message });
          return null;
        }
      },

      addRecipe: async (recipeData) => {
        set({ loading: true, error: null });
        try {
          const newRecipe = await recipeService.create(recipeData);
          set((state) => ({
            recipes: [...state.recipes, newRecipe],
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateRecipe: async (id, recipeData) => {
        set({ loading: true, error: null });
        try {
          await recipeService.update(id, recipeData);
          await get().fetchRecipes(); // Yeniden getir
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteRecipe: async (id) => {
        set({ loading: true, error: null });
        try {
          await recipeService.delete(id);
          set((state) => ({
            recipes: state.recipes.filter((r) => r.id !== id),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      processRecipeForSale: async (productId, quantity, orderId) => {
        try {
          await recipeService.processRecipe(productId, quantity, orderId);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },
    }),
    { name: 'recipe-store' }
  )
);

// ============================================
// CARİ HESAP STORE
// ============================================

interface AccountState {
  accounts: Account[];
  accountTransactions: AccountTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAccounts: (accountType?: string) => Promise<void>;
  fetchAccountTransactions: (accountId?: string) => Promise<void>;
  addAccount: (account: any) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: any) => Promise<void>;
  checkCreditLimit: (accountId: string, amount: number) => Promise<any>;
  getAccountById: (id: string) => Account | undefined;
}

export const useAccountStore = create<AccountState>()(
  devtools(
    (set, get) => ({
      accounts: [],
      accountTransactions: [],
      loading: false,
      error: null,

      fetchAccounts: async (accountType) => {
        set({ loading: true, error: null });
        try {
          const accounts = await accountService.getAll(accountType);
          set({ accounts, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchAccountTransactions: async (accountId) => {
        set({ loading: true, error: null });
        try {
          const transactions = await accountTransactionService.getAll(accountId);
          set({ accountTransactions: transactions, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addAccount: async (accountData) => {
        set({ loading: true, error: null });
        try {
          const newAccount = await accountService.create(accountData);
          set((state) => ({
            accounts: [...state.accounts, newAccount],
            loading: false,
          }));
          return newAccount;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateAccount: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const updated = await accountService.update(id, updates);
          set((state) => ({
            accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteAccount: async (id) => {
        set({ loading: true, error: null });
        try {
          await accountService.delete(id);
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== id),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      addTransaction: async (transactionData) => {
        try {
          const transaction = await accountTransactionService.create(transactionData);
          set((state) => ({
            accountTransactions: [transaction, ...state.accountTransactions],
          }));
          // Hesapları yeniden getir (bakiye güncellenmiş olabilir)
          get().fetchAccounts();
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      checkCreditLimit: async (accountId, amount) => {
        try {
          return await accountService.checkCreditLimit(accountId, amount);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      getAccountById: (id) => {
        return get().accounts.find((a) => a.id === id);
      },
    }),
    { name: 'account-store' }
  )
);
