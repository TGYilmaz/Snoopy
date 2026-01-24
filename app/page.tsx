'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { POSSidebar } from '@/components/pos-sidebar'
import { OrderScreen } from '@/components/order-screen'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.replace('/login')
    } else {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    )
  }

  return (
  <div className="min-h-screen flex bg-background">
    <POSSidebar />
    <main className="flex-1 p-6 overflow-y-auto">
      <OrderScreen />
    </main>
  </div>
)
