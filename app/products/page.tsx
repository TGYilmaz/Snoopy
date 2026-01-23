import { POSSidebar } from '@/components/pos-sidebar'
import { ProductManagement } from '@/components/product-management'

export default function ProductsPage() {
  return (
    <div className="h-screen flex bg-background">
      <POSSidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <ProductManagement />
      </main>
    </div>
  )
}
