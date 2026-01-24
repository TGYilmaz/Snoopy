'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, CreditCard, Banknote, Calendar, TrendingUp, ShoppingBag, Award } from 'lucide-react'
import { Order } from '@/lib/pos-types'
import { getOrders } from '@/lib/pos-store'

export function DailyReports() {
  const [orders, setOrders] = useState<Order[]>([])
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single')
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
  loadOrders()
}, [])

const loadOrders = async () => {
  const ordersData = await getOrders()
  setOrders(ordersData)
}
  const filteredOrders = useMemo(() => {
    if (dateMode === 'single') {
      return orders.filter(order => order.createdAt.startsWith(singleDate))
    }
    return orders.filter(order => {
      const orderDate = order.createdAt.split('T')[0]
      return orderDate >= startDate && orderDate <= endDate
    })
  }, [orders, dateMode, singleDate, startDate, endDate])

  const stats = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => o.status === 'completed')
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled')
    
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const cashRevenue = completedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0)
    const cardRevenue = completedOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0)

    // Calculate best selling product
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    
    for (const order of completedOrders) {
      for (const item of order.items) {
        const key = `${item.productId}-${item.isMenu ? 'menu' : 'product'}`
        if (!productSales[key]) {
          productSales[key] = { name: item.productName, quantity: 0, revenue: 0 }
        }
        productSales[key].quantity += item.quantity
        productSales[key].revenue += item.totalPrice
      }
    }

    const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)
    const bestSeller = sortedProducts[0] || null

    return {
      totalOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue,
      cashRevenue,
      cardRevenue,
      averageOrder: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      bestSeller,
      topProducts: sortedProducts.slice(0, 5),
    }
  }, [filteredOrders])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDateRangeLabel = () => {
    if (dateMode === 'single') {
      return formatDate(singleDate)
    }
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    return `${start.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Raporlar</h1>
          <p className="text-muted-foreground">{getDateRangeLabel()}</p>
        </div>
      </div>

      {/* Date Selection */}
      <Card className="p-4">
        <Tabs value={dateMode} onValueChange={(v) => setDateMode(v as 'single' | 'range')}>
          <TabsList className="mb-4">
            <TabsTrigger value="single">Tek Tarih</TabsTrigger>
            <TabsTrigger value="range">Tarih Aralığı</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="single-date" className="sr-only">Tarih</Label>
                <Input
                  id="single-date"
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSingleDate(new Date().toISOString().split('T')[0])}
                  className="bg-transparent"
                >
                  Bugün
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    setSingleDate(yesterday.toISOString().split('T')[0])
                  }}
                  className="bg-transparent"
                >
                  Dün
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="range" className="mt-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date" className="text-sm text-muted-foreground">Başlangıç</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-sm text-muted-foreground">Bitiş</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const weekAgo = new Date()
                    weekAgo.setDate(today.getDate() - 7)
                    setStartDate(weekAgo.toISOString().split('T')[0])
                    setEndDate(today.toISOString().split('T')[0])
                  }}
                  className="bg-transparent"
                >
                  Son 7 Gün
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const monthAgo = new Date()
                    monthAgo.setDate(today.getDate() - 30)
                    setStartDate(monthAgo.toISOString().split('T')[0])
                    setEndDate(today.toISOString().split('T')[0])
                  }}
                  className="bg-transparent"
                >
                  Son 30 Gün
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">Toplam Ciro</span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                ₺{stats.totalRevenue.toFixed(2)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-sm">Toplam Sipariş</span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {stats.totalOrders}
              </div>
              {stats.cancelledOrders > 0 && (
                <div className="text-sm text-destructive mt-1">
                  {stats.cancelledOrders} cancelled
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="text-sm">Nakit Ciro</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ₺{stats.cashRevenue.toFixed(2)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Kredi Kart Cirosu</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ₺{stats.cardRevenue.toFixed(2)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Ortalama Sipariş</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ₺{stats.averageOrder.toFixed(2)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-sm">En Çok Satan</span>
              </div>
              {stats.bestSeller ? (
                <div>
                  <div className="text-lg font-bold text-foreground truncate">
                    {stats.bestSeller.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.bestSeller.quantity} sold
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Satış Yok</div>
              )}
            </Card>
          </div>

          {/* Top Products */}
          {stats.topProducts.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">En Çok Satan Ürünler</h2>
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'secondary'} className="w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="font-medium text-foreground">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{product.quantity} sold</div>
                      <div className="text-sm text-muted-foreground">₺{product.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {filteredOrders.length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seçilen dönemde sipariş yok</p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
