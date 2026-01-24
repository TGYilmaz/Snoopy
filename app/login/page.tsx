'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      router.replace('/')
    } else {
      setChecking(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('E-posta veya şifre hatalı')
      return
    }

    router.push('/')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Snoopy POS</h1>
          <p className="text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              E-posta
            </label>
            <input
              type="email"
              className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Şifre
            </label>
            <input
              type="password"
              className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Demo: admin@burgerpos.com / 123456
          </p>
        </div>
      </div>
    </div>
  )
}
