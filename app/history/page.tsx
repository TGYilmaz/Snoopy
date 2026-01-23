import { POSSidebar } from '@/components/pos-sidebar'
import { OrderHistory } from '@/components/order-history'

export default function HistoryPage() {
  return (
    <div className="h-screen flex bg-background">
      <POSSidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <OrderHistory />
      </main>
    </div>
  )
}
