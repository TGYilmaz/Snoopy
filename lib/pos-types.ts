export interface Category {
  id: string
  name: string
  color: string
}

export interface Product {
  id: string
  name: string
  price: number
  categoryId: string
  image?: string
  active: boolean
  createdAt: string
}

export interface MenuItem {
  productId: string
  quantity: number
}

export interface Menu {
  id: string
  name: string
  items: MenuItem[]
  price: number
  image?: string
  active: boolean
  createdAt: string
}

export interface ShopSettings {
  name: string
  image?: string
}

export interface OrderItem {
  productId: string
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  isMenu?: boolean
}

// Yeni eklenen interface
export interface PaymentDetail {
  method: 'cash' | 'card'
  amount: number
}

// Güncellenmiş Order interface
export interface Order {
  id: string
  items: OrderItem[]
  total: number
  paymentMethod: 'cash' | 'card' | 'mixed' // mixed eklendi
  payments?: PaymentDetail[] // Opsiyonel: Çoklu ödeme detayları
  status: 'completed' | 'cancelled'
  createdAt: string
}

export interface DailyReport {
  date: string
  totalOrders: number
  totalRevenue: number
  cashRevenue: number
  cardRevenue: number
  cancelledOrders: number
  closedAt: string | null
}
