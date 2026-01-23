'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Minus, Trash2, CreditCard, Banknote, X, ImageIcon, Package } from 'lucide-react'
import { Product, Menu, OrderItem, Order, Category } from '@/lib/pos-types'
import { getProducts, getMenus, getCategories, saveOrder, generateId } from '@/lib/pos-store'

export function OrderScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    setProducts(getProducts().filter((p) => p.active))
    setMenus(getMenus().filter((m) => m.active))
    setCategories(getCategories())
  }, [])

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
  }, [])

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const completeOrder = useCallback(
    (paymentMethod: 'cash' | 'card') => {
      const order: Order = {
        id: generateId(),
        items: cart,
        total,
        paymentMethod,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }
      saveOrder(order)
      setCart([])
      setShowPaymentDialog(false)
      setShowSuccessDialog(true)
    },
    [cart, total]
  )

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

  return (
    <div className="flex h-full gap-6">
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
            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className="h-12 px-6"
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

            {/* Products Grid */}
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
                      <div className="grid grid-cols-3 gap-3">
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
              <div className="grid grid-cols-3 gap-3 pr-4">
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
      <Card className="w-96 flex flex-col bg-card">
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
                <div key={`${item.productId}-${item.isMenu ? 'menu' : 'product'}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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

          <Button className="w-full h-14 text-lg" disabled={cart.length === 0} onClick={() => setShowPaymentDialog(true)}>
            Ödeme Al ₺{total.toFixed(2)}
          </Button>
        </div>
      </Card>

      {/* Payment Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Ödeme Yöntemi Seçin</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Toplam: <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent" onClick={() => completeOrder('cash')}>
              <Banknote className="w-8 h-8" />
              <span className="text-lg">Nakit</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent" onClick={() => completeOrder('card')}>
              <CreditCard className="w-8 h-8" />
              <span className="text-lg">Kredi Kartı</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
          </AlertDialogFooter>
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
