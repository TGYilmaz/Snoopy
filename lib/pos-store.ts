'use client'

import { supabase } from './supabase'
import { Product, Order, Menu, ShopSettings, Category } from './pos-types'

const AUTH_KEY = 'pos_auth'

// Auth credentials
const VALID_USERNAME = 'snoopy_guzelyurt'
const VALID_PASSWORD = '**snoopyguzelyurt'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'burger', name: 'Sandviç', color: 'bg-orange-500' },
  { id: 'side', name: 'Atıştırmalıklar', color: 'bg-yellow-500' },
  { id: 'drink', name: 'İçecekler', color: 'bg-blue-500' },
  { id: 'dessert', name: 'Tatlılar', color: 'bg-pink-500' },
]

// ==================== CATEGORIES ====================
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    
    if (!data || data.length === 0) {
      // İlk kez açılıyorsa default kategorileri ekle
      for (const cat of DEFAULT_CATEGORIES) {
        await saveCategory(cat)
      }
      return DEFAULT_CATEGORIES
    }
    
    return data as Category[]
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function saveCategory(category: Category): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .upsert({
        id: category.id,
        name: category.name,
        color: category.color,
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving category:', error)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting category:', error)
  }
}

// ==================== PRODUCTS ====================
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      categoryId: p.category_id,
      image: p.image,
      active: p.active,
      createdAt: p.created_at,
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function saveProduct(product: Product): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .upsert({
        id: product.id,
        name: product.name,
        price: product.price,
        category_id: product.categoryId,
        image: product.image,
        active: product.active,
        created_at: product.createdAt,
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving product:', error)
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting product:', error)
  }
}

// ==================== MENUS ====================
export async function getMenus(): Promise<Menu[]> {
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(m => ({
      id: m.id,
      name: m.name,
      items: m.items || [],
      price: m.price,
      image: m.image,
      active: m.active,
      createdAt: m.created_at,
    }))
  } catch (error) {
    console.error('Error fetching menus:', error)
    return []
  }
}

export async function saveMenu(menu: Menu): Promise<void> {
  try {
    const { error } = await supabase
      .from('menus')
      .upsert({
        id: menu.id,
        name: menu.name,
        items: menu.items,
        price: menu.price,
        image: menu.image,
        active: menu.active,
        created_at: menu.createdAt,
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving menu:', error)
  }
}

export async function deleteMenu(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting menu:', error)
  }
}

// ==================== ORDERS ====================
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(o => ({
      id: o.id,
      items: o.items || [],
      total: o.total,
      paymentMethod: o.payment_method,
      payments: o.payments || undefined, // Karma ödeme detayları
      status: o.status,
      createdAt: o.created_at,
    }))
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

export async function saveOrder(order: Order): Promise<void> {
  try {
    const { error } = await supabase
      .from('orders')
      .insert({
        id: order.id,
        items: order.items,
        total: order.total,
        payment_method: order.paymentMethod,
        payments: order.payments || null, // Karma ödeme detaylarını kaydet
        status: order.status,
        created_at: order.createdAt,
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving order:', error)
  }
}

export async function updateOrder(order: Order): Promise<void> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        items: order.items,
        total: order.total,
        payment_method: order.paymentMethod,
        payments: order.payments || null, // Karma ödeme detaylarını güncelle
        status: order.status,
      })
      .eq('id', order.id)

    if (error) throw error
  } catch (error) {
    console.error('Error updating order:', error)
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting order:', error)
  }
}

export async function getOrdersByDate(date: string): Promise<Order[]> {
  try {
    const startDate = `${date}T00:00:00`
    const endDate = `${date}T23:59:59`
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(o => ({
      id: o.id,
      items: o.items || [],
      total: o.total,
      paymentMethod: o.payment_method,
      payments: o.payments || undefined, // Karma ödeme detayları
      status: o.status,
      createdAt: o.created_at,
    }))
  } catch (error) {
    console.error('Error fetching orders by date:', error)
    return []
  }
}

// ==================== SHOP SETTINGS ====================
export async function getShopSettings(): Promise<ShopSettings> {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // İlk kez açılıyorsa default ayarları ekle
      const defaultSettings = { name: 'Burger POS' }
      await saveShopSettings(defaultSettings)
      return defaultSettings
    }
    
    return {
      name: data.name,
      image: data.image,
    }
  } catch (error) {
    console.error('Error fetching shop settings:', error)
    return { name: 'Burger POS' }
  }
}

export async function saveShopSettings(settings: ShopSettings): Promise<void> {
  try {
    // İlk kayıt var mı kontrol et
    const { data: existing } = await supabase
      .from('shop_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Güncelle
      const { error } = await supabase
        .from('shop_settings')
        .update({
          name: settings.name,
          image: settings.image,
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Yeni ekle
      const { error } = await supabase
        .from('shop_settings')
        .insert({
          name: settings.name,
          image: settings.image,
        })

      if (error) throw error
    }
  } catch (error) {
    console.error('Error saving shop settings:', error)
  }
}

// ==================== DAILY REPORTS ====================
// Reports artık orders tablosundan dinamik hesaplanacak
export async function getTodayReport() {
  const today = new Date().toISOString().split('T')[0]
  const orders = await getOrdersByDate(today)
  
  const completed = orders.filter(o => o.status === 'completed')
  const cancelled = orders.filter(o => o.status === 'cancelled')
  
  const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0)
  
  // Karma ödeme desteği ile gelir hesaplama
  let cashRevenue = 0
  let cardRevenue = 0

  for (const order of completed) {
    if (order.paymentMethod === 'cash') {
      cashRevenue += order.total
    } else if (order.paymentMethod === 'card') {
      cardRevenue += order.total
    } else if (order.paymentMethod === 'mixed' && order.payments) {
      // Karma ödemede her ödeme tipini ayrı hesapla
      for (const payment of order.payments) {
        if (payment.method === 'cash') {
          cashRevenue += payment.amount
        } else if (payment.method === 'card') {
          cardRevenue += payment.amount
        }
      }
    }
  }
  
  return {
    date: today,
    totalOrders: completed.length,
    totalRevenue,
    cashRevenue,
    cardRevenue,
    cancelledOrders: cancelled.length,
    closedAt: null,
  }
}

export async function getDailyReports() {
  // Son 30 günün raporlarını getir
  const reports = []
  const today = new Date()
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const orders = await getOrdersByDate(dateStr)
    const completed = orders.filter(o => o.status === 'completed')
    const cancelled = orders.filter(o => o.status === 'cancelled')
    
    const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0)
    
    // Karma ödeme desteği ile gelir hesaplama
    let cashRevenue = 0
    let cardRevenue = 0

    for (const order of completed) {
      if (order.paymentMethod === 'cash') {
        cashRevenue += order.total
      } else if (order.paymentMethod === 'card') {
        cardRevenue += order.total
      } else if (order.paymentMethod === 'mixed' && order.payments) {
        // Karma ödemede her ödeme tipini ayrı hesapla
        for (const payment of order.payments) {
          if (payment.method === 'cash') {
            cashRevenue += payment.amount
          } else if (payment.method === 'card') {
            cardRevenue += payment.amount
          }
        }
      }
    }
    
    if (orders.length > 0) {
      reports.push({
        date: dateStr,
        totalOrders: completed.length,
        totalRevenue,
        cashRevenue,
        cardRevenue,
        cancelledOrders: cancelled.length,
        closedAt: null,
      })
    }
  }
  
  return reports
}

export function saveDailyReport() {
  // Artık gerekli değil, orders tablosundan hesaplanıyor
}

// ==================== HELPERS ====================
export function generateId(): string {
  return crypto.randomUUID()
}

// ==================== AUTH ====================
export async function login(email: string, password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Login error:', error)
      return false
    }
    
    return !!data.session
  } catch (error) {
    console.error('Login error:', error)
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession()
    return !!data.session
  } catch (error) {
    return false
  }
}

export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch (error) {
    return null
  }
}
