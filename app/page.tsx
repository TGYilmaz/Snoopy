import { POSSidebar } from '@/components/pos-sidebar'
import { OrderScreen } from '@/components/order-screen'

export default function HomePage() {
  return (
    <div className="h-screen flex bg-background">
      <POSSidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <OrderScreen />
      </main>
    </div>
  )
}
