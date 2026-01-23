'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreditCard, Banknote, Search, Receipt, MoreVertical, Pencil, Trash2, XCircle, Plus, Minus } from 'lucide-react'
import { Order, OrderItem } from '@/lib/pos-types'
import { getOrders, updateOrder, deleteOrder } from '@/lib/pos-store'

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchDate, setSearchDate] = useState('')
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null)
  const [editItems, setEditItems] = useState<OrderItem[]>([])

  const loadOrders = useCallback(() => {
    setOrders(getOrders())
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const filteredOrders = searchDate
    ? orders.filter(order => order.createdAt.startsWith(searchDate))
    : orders

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleDeleteOrder = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete.id)
      loadOrders()
      setOrderToDelete(null)
    }
  }

  const handleCancelOrder = () => {
    if (orderToCancel) {
      const updated: Order = { ...orderToCancel, status: 'cancelled' }
      updateOrder(updated)
      loadOrders()
      setOrderToCancel(null)
    }
  }

  const openEditDialog = (order: Order) => {
    setOrderToEdit(order)
    setEditItems([...order.items])
  }

  const updateEditQuantity = (index: number, delta: number) => {
    setEditItems((prev) => {
      const updated = [...prev]
      const newQty = updated[index].quantity + delta
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index)
      }
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        totalPrice: newQty * updated[index].unitPrice,
      }
      return updated
    })
  }

  const handleSaveEdit = () => {
    if (orderToEdit && editItems.length > 0) {
      const newTotal = editItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const updated: Order = {
        ...orderToEdit,
        items: editItems,
        total: newTotal,
      }
      updateOrder(updated)
      loadOrders()
      setOrderToEdit(null)
    }
  }

  const editTotal = editItems.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sipariş Geçmişi</h1>
          <p className="text-muted-foreground">Geçmiş Siparişleri Görüntüle</p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            className="w-auto"
          />
          {searchDate && (
            <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>
              Temizle
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchDate ? 'No orders found for this date' : 'Henüz Sipariş Yok'}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-card-foreground">
                        Sipariş #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <Badge
                        variant={order.status === 'tamamlandı' ? 'default' : 'İptal Edildi'}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {order.paymentMethod === 'cash' ? (
                        <Banknote className="w-5 h-5 text-green-600" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="text-lg font-semibold text-card-foreground">
                        ₺{order.total.toFixed(2)}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(order)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Siparişi Düzenle
                        </DropdownMenuItem>
                        {order.status === 'completed' && (
                          <DropdownMenuItem onClick={() => setOrderToCancel(order)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Siparişi İptal Et
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setOrderToDelete(order)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Siparişi Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.productName}
                        {item.isMenu && <Badge variant="outline" className="ml-1 text-[10px]">Menu</Badge>}
                      </span>
                      <span className="text-card-foreground">₺{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation */}
      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
           <AlertDialogTitle>Sipariş Silinsin mi?</AlertDialogTitle>
<AlertDialogDescription>
  #{orderToDelete?.id.slice(-6).toUpperCase()} numaralı sipariş kalıcı olarak silinecektir. Bu işlem geri alınamaz.
</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sipariş İptal Edilsin Mi?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark order #{orderToCancel?.id.slice(-6).toUpperCase()} as cancelled. The order will remain in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Geri Dön</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder}>Siparişi İptal Et</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!orderToEdit} onOpenChange={() => setOrderToEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Siparişi Düzenle #{orderToEdit?.id.slice(-6).toUpperCase()}</DialogTitle>
            <DialogDescription>Ürünleri ve adetleri düzenleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {editItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {item.productName}
                    {item.isMenu && <Badge variant="outline" className="ml-1 text-[10px]">Menu</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">₺
                    {item.unitPrice.toFixed(2)} adet fiyatı</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateEditQuantity(index, -1)}
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateEditQuantity(index, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="w-20 text-right font-medium">₺{item.totalPrice.toFixed(2)}</div>
              </div>
            ))}
            {editItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Siparişte ürün yok. Ürün ekleyin veya siparişi silin.
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Toplam</span>
            <span>${editTotal.toFixed(2)}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderToEdit(null)} className="bg-transparent">
              İptal
            </Button>
            <Button onClick={handleSaveEdit} disabled={editItems.length === 0}>
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
