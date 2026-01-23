'use client'

import React from "react"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ShoppingCart, Package, History, BarChart3, Settings, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ShopSettings } from '@/lib/pos-types'
import { getShopSettings, saveShopSettings } from '@/lib/pos-store'

const navItems = [
  { href: '/', label: 'Siparişler', icon: ShoppingCart },
  { href: '/products', label: 'Ürünler', icon: Package },
  { href: '/history', label: 'Geçmiş', icon: History },
  { href: '/reports', label: 'Gün Sonu', icon: BarChart3 },
]

export function POSSidebar() {
  const pathname = usePathname()
  const [settings, setSettings] = useState<ShopSettings>({ name: 'Snoopy' })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ShopSettings>({ name: '' })

  useEffect(() => {
    const saved = getShopSettings()
    setSettings(saved)
  }, [])

  const openSettingsDialog = () => {
    setFormData(settings)
    setDialogOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    saveShopSettings(formData)
    setSettings(formData)
    setDialogOpen(false)
  }

const logout = () => {
    localStorage.removeItem('isLoggedIn')
    window.location.href = '/login'
  }
  
  return (
    <>
      <aside className="w-20 bg-card border-r border-border flex flex-col items-center py-6 gap-2">
        <button
          onClick={openSettingsDialog}
          className="mb-6 group relative"
          title="Mağaza Ayarları"
        >
          {settings.image ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden relative">
              <Image
                src={settings.image || "/placeholder.svg"}
                alt={settings.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                {settings.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
        </button>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

<button
    onClick={logout}
    className="mt-auto mb-2 w-14 h-14 rounded-xl
               flex flex-col items-center justify-center
               text-muted-foreground hover:bg-destructive
               hover:text-destructive-foreground transition-colors"
    title="Çıkış Yap"
  >
    <span className="text-[10px] font-medium">Çıkış</span>
  </button>
      </aside>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mağaza Ayarları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {formData.image ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden relative">
                    <Image
                      src={formData.image || "/placeholder.svg"}
                      alt="Mağaza Logosu"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="shop-image" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Logo Yükle</span>
                  </Button>
                </Label>
                <Input
                  id="shop-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-name">Mağaza Adı</Label>
              <Input
                id="shop-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Mağaza adını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
