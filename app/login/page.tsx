'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Giriş başarısız')
      return
    }

    router.push('/')
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4 text-center">POS Giriş</h1>

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </div>
    </div>
  )
}
