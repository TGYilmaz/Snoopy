'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { POSSidebar } from '@/components/pos-sidebar'
import { OrderScreen } from '@/components/order-screen'

export default function HomePage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [])

  if (!checked) return null

  return (
    <div className="h-screen flex bg-background">
      <POSSidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <OrderScreen />
      </main>
    </div>
  )
}
