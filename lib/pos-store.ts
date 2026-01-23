'use client'

import { Product, Order, DailyReport, Menu, ShopSettings, Category } from './pos-types'

const PRODUCTS_KEY = 'pos_products'
const ORDERS_KEY = 'pos_orders'
const REPORTS_KEY = 'pos_reports'
const MENUS_KEY = 'pos_menus'
const SHOP_SETTINGS_KEY = 'pos_shop_settings'
const CATEGORIES_KEY = 'pos_categories'
const AUTH_KEY = 'pos_auth'

// Auth credentials
const VALID_USERNAME = 'snoopy_guzelyurt'
const VALID_PASSWORD = '**snoopyguzelyurt'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'burger', name: 'Burger', color: 'bg-orange-500' },
  { id: 'side', name: 'Side', color: 'bg-yellow-500' },
  { id: 'drink', name: 'Drink', color: 'bg-blue-500' },
  { id: 'dessert', name: 'Dessert', color: 'bg-pink-500' },
]

// Products
export function getProducts(): Product[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(PRODUCTS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveProduct(product: Product): void {
  const products = getProducts()
  const existingIndex = products.findIndex(p => p.id === product.id)
  if (existingIndex >= 0) {
    products[existingIndex] = product
  } else {
    products.push(product)
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter(p => p.id !== id)
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
}

// Orders
export function getOrders(): Order[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(ORDERS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveOrder(order: Order): void {
  const orders = getOrders()
  orders.unshift(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function updateOrder(order: Order): void {
  const orders = getOrders()
  const idx = orders.findIndex((o) => o.id === order.id)
  if (idx >= 0) {
    orders[idx] = order
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  }
}

export function deleteOrder(id: string): void {
  const orders = getOrders().filter((o) => o.id !== id)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function getOrdersByDate(date: string): Order[] {
  return getOrders().filter(order => order.createdAt.startsWith(date))
}

// Daily Reports
export function getDailyReports(): DailyReport[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(REPORTS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveDailyReport(report: DailyReport): void {
  const reports = getDailyReports()
  const existingIndex = reports.findIndex(r => r.date === report.date)
  if (existingIndex >= 0) {
    reports[existingIndex] = report
  } else {
    reports.unshift(report)
  }
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
}

export function getTodayReport(): DailyReport | null {
  const today = new Date().toISOString().split('T')[0]
  return getDailyReports().find(r => r.date === today) || null
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Menus
export function getMenus(): Menu[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(MENUS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveMenu(menu: Menu): void {
  const menus = getMenus()
  const existingIndex = menus.findIndex((m) => m.id === menu.id)
  if (existingIndex >= 0) {
    menus[existingIndex] = menu
  } else {
    menus.push(menu)
  }
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus))
}

export function deleteMenu(id: string): void {
  const menus = getMenus().filter((m) => m.id !== id)
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus))
}

// Shop Settings
export function getShopSettings(): ShopSettings {
  if (typeof window === 'undefined') return { name: 'Burger POS' }
  const data = localStorage.getItem(SHOP_SETTINGS_KEY)
  return data ? JSON.parse(data) : { name: 'Burger POS' }
}

export function saveShopSettings(settings: ShopSettings): void {
  localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(settings))
}

// Categories
export function getCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES
  const data = localStorage.getItem(CATEGORIES_KEY)
  if (!data) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES))
    return DEFAULT_CATEGORIES
  }
  return JSON.parse(data)
}

export function saveCategory(category: Category): void {
  const categories = getCategories()
  const existingIndex = categories.findIndex((c) => c.id === category.id)
  if (existingIndex >= 0) {
    categories[existingIndex] = category
  } else {
    categories.push(category)
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export function deleteCategory(id: string): void {
  const categories = getCategories().filter((c) => c.id !== id)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

// Auth
export function login(username: string, password: string): boolean {
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true')
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}
