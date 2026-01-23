'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const VALID_USERNAME = 'snoopy_guzelyurt'
const VALID_PASSWORD = '**snoopyguzelyurt'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem('isLoggedIn', 'true')
      router.push('/')
    } else {
      setError('Kullanıcı adı veya şifre hatalı')
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4 text-center">POS Giriş</h1>

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          className="w-full bg-primary text-primary-foreground py-2 rounded"
        >
          Giriş Yap
        </button>
      </div>
    </div>
  )
}
