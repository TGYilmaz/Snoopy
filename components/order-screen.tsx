'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Minus, Trash2, CreditCard, Banknote, X, ImageIcon, Package, Wallet, AlertTriangle, User } from 'lucide-react'
import { Product, Menu, OrderItem, Order, Category, PaymentDetail } from '@/lib/pos-types'
import { getProducts, getMenus, getCategories, saveOrder, generateId } from '@/lib/pos-store'
import { supabase } from '@/lib/supabase'

export function OrderScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  // Cari hesap state'leri
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [isCredit, setIsCredit] = useState(false)
  const [stockWarning, setStockWarning] = useState<string | null>(null)
  const [creditWarning, setCreditWarning] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Ödeme dialog state'leri
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [cashAmount, setCashAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [paymentStep, setPaymentStep] = useState<'method' | 'details'>('method')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed' | null>(null)

  useEffect(() => {
    loadData()
    loadAccounts()
  }, [])

  const loadData = async () => {
    const [productsData, menusData, categoriesData] = await Promise.all([
      getProducts(),
      getMenus(),
      getCategories(),
    ])
    setProducts(productsData.filter((p) => p.active))
    setMenus(menusData.filter((m) => m.active))
    setCategories(categoriesData)
  }

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_type', 'customer')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Cari hesaplar yüklenemedi:', error)
      setAccounts([])
    }
  }

  const getProductById = (id: string) => products.find((p) => p.id === id)

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && !item.isMenu)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && !item.isMenu
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
        },
      ]
    })
  }, [])

  const addMenuToCart = useCallback((menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === menu.id && item.isMenu)
      if (existing) {
        return prev.map((item) =>
          item.productId === menu.id && item.isMenu
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: menu.id,
          productName: menu.name,
          productImage: menu.image,
          quantity: 1,
          unitPrice: menu.price,
          totalPrice: menu.price,
          isMenu: true,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number, isMenu?: boolean) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId && item.isMenu === isMenu) {
            const newQty = item.quantity + delta
            if (newQty <= 0) return null
            return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
          }
          return item
        })
        .filter((item): item is OrderItem => item !== null)
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedAccount(null)
    setIsCredit(false)
    setStockWarning(null)
    setCreditWarning(null)
  }, [])

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const getItemKey = (item: OrderItem) => `${item.productId}-${item.isMenu ? 'menu' : 'product'}`

  const toggleItemSelection = (item: OrderItem) => {
    const key = getItemKey(item)
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const selectAllItems = () => {
    setSelectedItems(new Set(cart.map(getItemKey)))
  }

  const deselectAllItems = () => {
    setSelectedItems(new Set())
  }

  const getSelectedTotal = () => {
    return cart
      .filter(item => selectedItems.has(getItemKey(item)))
      .reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const openPaymentDialog = async () => {
    if (isCredit && selectedAccount) {
      await completeOrder('credit', false);
      return;
    }
    
    setIsProcessing(true)
    setStockWarning(null)
    
    try {
      // Stok kontrolü
      const { checkStockAvailability } = await import('@/lib/order-integration')
      const stockCheck = await checkStockAvailability(cart)
      
      if (!stockCheck.available) {
        const unavailableProducts = stockCheck.unavailableItems
          .map(item => `${item.product_name} (İstenilen: ${item.requested}, Mevcut: ${item.available})`)
          .join('\n')
        setStockWarning(`Yetersiz stok:\n${unavailableProducts}`)
        setIsProcessing(false)
        return
      }
    } catch (error) {
      console.error('Stok kontrolü hatası:', error)
    } finally {
      setIsProcessing(false)
    }
    
    selectAllItems()
    setPaymentMethod(null)
    setPaymentStep('method')
    setCashAmount('')
    setCardAmount('')
    setShowPaymentDialog(true)
  }

  const handlePaymentMethodSelect = (method: 'cash' | 'card' | 'mixed') => {
    setPaymentMethod(method)
    
    if (method === 'cash' || method === 'card') {
      completeOrder(method, selectedItems.size > 0 && selectedItems.size < cart.length)
    } else {
      setPaymentStep('details')
    }
  }

 const completeOrder = async (
    method: 'cash' | 'card' | 'mixed' | 'credit',
    isPartial: boolean = false
  ) => {
    setIsProcessing(true)
    
    try {
      // Veresiye kontrolü
      if (method === 'credit' || isCredit) {
        if (!selectedAccount) {
          alert('Veresiye satış için lütfen bir cari hesap seçin')
          setIsProcessing(false)
          return
        }
        
        const itemsToSave = isPartial 
          ? cart.filter(item => selectedItems.has(getItemKey(item)))
          : cart

        const order: Order = {
          id: generateId(),
          items: itemsToSave,
          total: isPartial ? getSelectedTotal() : total,
          paymentMethod: 'credit',
          payments: [], // Veresiye'de ödeme bilgisi yok
          status: 'completed',
          createdAt: new Date().toISOString(),
        }

        await saveOrder(order)

        // Entegrasyon
        try {
          const { processOrderWithIntegration } = await import('@/lib/order-integration')
          await processOrderWithIntegration({
            orderId: order.id,
            items: itemsToSave,
            totalAmount: order.total,
            paymentMethod: 'credit',
            accountId: selectedAccount,
            isCredit: true,
          })
        } catch (integrationError) {
          console.error('Entegrasyon hatası:', integrationError)
        }

        if (isPartial) {
          setCart(prev => prev.filter(item => !selectedItems.has(getItemKey(item))))
        } else {
          setCart([])
        }

        setShowPaymentDialog(false)
        setShowSuccessDialog(true)
        setPaymentStep('method')
        setPaymentMethod(null)
        setCashAmount('')
        setCardAmount('')
        deselectAllItems()
        setSelectedAccount(null)
        setIsCredit(false)
        setStockWarning(null)
        setCreditWarning(null)
        setIsProcessing(false)
        return
      }
      
      // Normal ödeme akışı
      const cash = parseFloat(cashAmount) || 0
      const card = parseFloat(cardAmount) || 0
      
      if (method === 'mixed' && (cash + card) === 0) {
        alert('Lütfen ödeme tutarlarını giriniz')
        setIsProcessing(false)
        return
      }

      const payments: PaymentDetail[] = []
      
      if (method === 'cash') {
        payments.push({ method: 'cash', amount: isPartial ? getSelectedTotal() : total })
      } else if (method === 'card') {
        payments.push({ method: 'card', amount: isPartial ? getSelectedTotal() : total })
      } else if (method === 'mixed') {
        if (cash > 0) payments.push({ method: 'cash', amount: cash })
        if (card > 0) payments.push({ method: 'card', amount: card })
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const expectedAmount = isPartial ? getSelectedTotal() : total

      if (method === 'mixed' && Math.abs(totalPaid - expectedAmount) > 0.01) {
        alert(`Ödeme tutarı toplam tutara eşit olmalıdır. Beklenen: ₺${expectedAmount.toFixed(2)}, Girilen: ₺${totalPaid.toFixed(2)}`)
        setIsProcessing(false)
        return
      }

      const itemsToSave = isPartial 
        ? cart.filter(item => selectedItems.has(getItemKey(item)))
        : cart

      const order: Order = {
        id: generateId(),
        items: itemsToSave,
        total: isPartial ? getSelectedTotal() : total,
        paymentMethod: method,
        payments,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }

      await saveOrder(order)

      // Entegrasyon
      try {
        const { processOrderWithIntegration } = await import('@/lib/order-integration')
        await processOrderWithIntegration({
          orderId: order.id,
          items: itemsToSave,
          totalAmount: order.total,
          paymentMethod: method,
          accountId: selectedAccount || undefined,
          isCredit: false,
        })
      } catch (integrationError) {
        console.error('Entegrasyon hatası:', integrationError)
      }

      if (isPartial) {
        setCart(prev => prev.filter(item => !selectedItems.has(getItemKey(item))))
      } else {
        setCart([])
      }

      setShowPaymentDialog(false)
      setShowSuccessDialog(true)
      setPaymentStep('method')
      setPaymentMethod(null)
      setCashAmount('')
      setCardAmount('')
      deselectAllItems()
      setSelectedAccount(null)
      setIsCredit(false)
      setStockWarning(null)
      setCreditWarning(null)
    } catch (error) {
      console.error('Sipariş tamamlama hatası:', error)
      alert('Sipariş tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter((p) => p.categoryId === selectedCategory)

  const groupedProducts = categories.reduce(
    (acc, category) => {
      const categoryProducts = filteredProducts.filter((p) => p.categoryId === category.id)
      if (categoryProducts.length > 0) {
        acc[category.id] = categoryProducts
      }
      return acc
    },
    {} as Record<string, Product[]>
  )

  const selectedTotal = getSelectedTotal()
  const remainingCash = parseFloat(cashAmount) || 0
  const remainingCard = parseFloat(cardAmount) || 0
  const remainingAmount = selectedTotal - remainingCash - remainingCard

  return (
    <div className="flex flex-col md:flex-row h-full gap-6">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col gap-4">
        <Tabs defaultValue="products" className="flex-1 flex flex-col">
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="products">Ürünler</TabsTrigger>
              <TabsTrigger value="menus">Menüler</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className="h-12 px-6 whitespace-nowrap flex-shrink-0"
              >
                Tümü
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-12 px-6"
                >
                  <span className={`w-2 h-2 rounded-full ${category.color} mr-2`} />
                  {category.name}
                </Button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {categories.map((category) => {
                  const categoryProducts = groupedProducts[category.id]
                  if (!categoryProducts || categoryProducts.length === 0) return null
                  return (
                    <div key={category.id}>
                      {selectedCategory === 'all' && (
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${category.color}`} />
                          {category.name}
                        </h3>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
                          >
                            <div className="flex gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {product.image ? (
                                  <Image
                                    src={product.image || "/placeholder.svg"}
                                    alt={product.name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-card-foreground group-hover:text-accent-foreground text-balance line-clamp-2">
                                  {product.name}
                                </div>
                                <div className="text-lg font-semibold text-primary mt-1">₺{product.price.toFixed(2)}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    Ürün bulunamadı. Ürünler sekmesinden ürün ekleyebilirsiniz.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="menus" className="flex-1 flex flex-col gap-4 mt-4">
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                {menus.map((menu) => {
                  const menuItems = menu.items || []
                  return (
                    <button
                      key={menu.id}
                      onClick={() => addMenuToCart(menu)}
                      className="p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {menu.image ? (
                            <Image
                              src={menu.image || "/placeholder.svg"}
                              alt={menu.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-card-foreground group-hover:text-accent-foreground text-balance line-clamp-2">
                            {menu.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {menuItems.slice(0, 2).map((item, idx) => {
                              const p = getProductById(item.productId)
                              return p ? (
                                <span key={item.productId}>
                                  {idx > 0 && ', '}
                                  {item.quantity > 1 && `${item.quantity}x `}{p.name}
                                </span>
                              ) : null
                            })}
                            {menuItems.length > 2 && '...'}
                          </div>
                          <div className="text-lg font-semibold text-primary mt-1">₺{menu.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {menus.length === 0 && (
                  <div className="col-span-3 text-center text-muted-foreground py-12">
                    Menü bulunamadı. Ürünler sekmesinden menü oluşturabilirsiniz.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Section */}
      <Card className="w-full md:w-96 flex flex-col bg-card md:max-h-screen">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">Mevcut Sipariş</h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Siparişe eklemek için ürün seçin</div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={getItemKey(item)} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage || "/placeholder.svg"}
                        alt={item.productName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.isMenu ? (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-card-foreground truncate flex items-center gap-1">
                      {item.productName}
                      {item.isMenu && (
                        <Badge variant="secondary" className="text-[10px] px-1">
                          Menu
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">₺{item.unitPrice.toFixed(2)} adet</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => updateQuantity(item.productId, -1, item.isMenu)}
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </Button>
                    <span className="w-8 text-center font-medium text-card-foreground">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => updateQuantity(item.productId, 1, item.isMenu)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="w-16 text-right font-medium text-card-foreground">₺{item.totalPrice.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-4">
          <div className="flex justify-between text-lg font-semibold text-card-foreground">
            <span>Toplam</span>
            <span>₺{total.toFixed(2)}</span>
          </div>

          {/* Cari Hesap Seçimi */}
          {cart.length > 0 && accounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Cari Hesap (Opsiyonel)</label>
              </div>
              <Select value={selectedAccount || undefined} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Cari seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (Bakiye: ₺{account.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="credit" 
                  checked={isCredit}
                  onCheckedChange={(checked) => setIsCredit(checked as boolean)}
                  disabled={!selectedAccount}
                />
                <label
                  htmlFor="credit"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    !selectedAccount ? 'text-muted-foreground' : ''
                  }`}
                >
                  Veresiye
                </label>
              </div>
              {stockWarning && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400 whitespace-pre-line">{stockWarning}</p>
                </div>
              )}
            </div>
          )}

          <Button className="w-full h-14 text-lg" disabled={cart.length === 0 || isProcessing} onClick={openPaymentDialog}>
            {isProcessing ? 'İşleniyor...' : `Ödeme Al ₺${total.toFixed(2)}`}
          </Button>
        </div>
      </Card>

      {/* Payment Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              {paymentStep === 'method' ? 'Ödeme Yöntemi Seçin' : 'Ödeme Detayları'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Toplam: <span className="font-semibold text-foreground">₺{total.toFixed(2)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {paymentStep === 'method' ? (
            <>
              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-4 pr-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Ödenecek Ürünleri Seçin</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllItems}>
                        Tümünü Seç
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAllItems}>
                        Temizle
                      </Button>
                    </div>
                  </div>

                  {cart.map((item) => (
                    <div
                      key={getItemKey(item)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
                      onClick={() => toggleItemSelection(item)}
                    >
                      <Checkbox
                        checked={selectedItems.has(getItemKey(item))}
                        onCheckedChange={() => toggleItemSelection(item)}
                      />
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.productImage ? (
                          <Image
                            src={item.productImage || "/placeholder.svg"}
                            alt={item.productName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.isMenu ? (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity}x ₺{item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-semibold">₺{item.totalPrice.toFixed(2)}</div>
                    </div>
                  ))}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Seçili Ürünler Toplamı</span>
                      <span className="text-primary">₺{selectedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {!isCredit ? (
                <div className="grid grid-cols-3 gap-4 py-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => handlePaymentMethodSelect('cash')}
                    disabled={selectedItems.size === 0}
                  >
                    <Banknote className="w-8 h-8" />
                    <span className="text-lg">Nakit</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => handlePaymentMethodSelect('card')}
                    disabled={selectedItems.size === 0}
                  >
                    <CreditCard className="w-8 h-8" />
                    <span className="text-lg">Kredi Kartı</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => handlePaymentMethodSelect('mixed')}
                    disabled={selectedItems.size === 0}
                  >
                    <Wallet className="w-8 h-8" />
                    <span className="text-lg">Karma</span>
                  </Button>
                </div>
              ) : (
                <div className="py-6">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <AlertTriangle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-600 dark:text-blue-400">Veresiye Satış</p>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                        Bu satış açık veresiye olarak kaydedilecektir. Ödeme daha sonra alınacaktır.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                {isCredit && (
                  <Button
                    onClick={() => completeOrder('cash', selectedItems.size < cart.length)}
                    disabled={selectedItems.size === 0 || isProcessing || !selectedAccount}
                  >
                    {isProcessing ? 'İşleniyor...' : 'Veresiye Kaydet'}
                  </Button>
                )}
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-lg font-semibold mb-2">
                    <span>Ödenecek Tutar</span>
                    <span className="text-primary">₺{selectedTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedItems.size} ürün seçildi
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nakit Ödeme</label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Kredi Kartı Ödeme</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(e.target.value)}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nakit</span>
                    <span className="font-medium">₺{(parseFloat(cashAmount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kredi Kartı</span>
                    <span className="font-medium">₺{(parseFloat(cardAmount) || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Kalan</span>
                    <span className={remainingAmount > 0.01 ? 'text-destructive' : 'text-green-600'}>
                      ₺{remainingAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPaymentStep('method')}>Geri</AlertDialogCancel>
                <Button
                  onClick={() => completeOrder('mixed', selectedItems.size < cart.length)}
                  disabled={Math.abs(remainingAmount) > 0.01}
                >
                  Ödemeyi Tamamla
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-center">Sipariş Tamamlandı!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg">Ödeme başarıyla alındı.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction className="px-8">Kapat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
