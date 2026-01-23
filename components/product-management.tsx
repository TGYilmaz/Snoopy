'use client'

import React from "react"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Pencil, Trash2, ImageIcon, Package, Minus, Settings } from 'lucide-react'
import { Product, Menu, Category, MenuItem } from '@/lib/pos-types'
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getMenus,
  saveMenu,
  deleteMenu,
  getCategories,
  saveCategory,
  deleteCategory,
  generateId,
} from '@/lib/pos-store'

const CATEGORY_COLORS = [
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-yellow-500', label: 'Yellow' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-teal-500', label: 'Teal' },
]

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteMenuDialogOpen, setDeleteMenuDialogOpen] = useState(false)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    image: '' as string | undefined,
    active: true,
  })

  const [menuFormData, setMenuFormData] = useState({
    name: '',
    price: '',
    items: [] as MenuItem[],
    image: '' as string | undefined,
    active: true,
  })

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: 'bg-orange-500',
  })

  useEffect(() => {
    setProducts(getProducts())
    setMenus(getMenus())
    setCategories(getCategories())
  }, [])

  const refreshData = () => {
    setProducts(getProducts())
    setMenus(getMenus())
    setCategories(getCategories())
  }

  const getCategoryById = (id: string) => categories.find((c) => c.id === id)

  const openNewDialog = () => {
    setEditingProduct(null)
    setFormData({ name: '', price: '', categoryId: categories[0]?.id || '', image: undefined, active: true })
    setDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId,
      image: product.image,
      active: product.active,
    })
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

  const handleMenuImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setMenuFormData((prev) => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    const price = parseFloat(formData.price)
    if (!formData.name.trim() || isNaN(price) || price <= 0 || !formData.categoryId) return

    const product: Product = {
      id: editingProduct?.id || generateId(),
      name: formData.name.trim(),
      price,
      categoryId: formData.categoryId,
      image: formData.image,
      active: formData.active,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    }

    saveProduct(product)
    refreshData()
    setDialogOpen(false)
  }

  const confirmDelete = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id)
      refreshData()
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const toggleActive = (product: Product) => {
    saveProduct({ ...product, active: !product.active })
    refreshData()
  }

  // Menu functions
  const openNewMenuDialog = () => {
    setEditingMenu(null)
    setMenuFormData({ name: '', price: '', items: [], image: undefined, active: true })
    setMenuDialogOpen(true)
  }

  const openEditMenuDialog = (menu: Menu) => {
    setEditingMenu(menu)
    setMenuFormData({
      name: menu.name,
      price: menu.price.toString(),
      items: menu.items,
      image: menu.image,
      active: menu.active,
    })
    setMenuDialogOpen(true)
  }

  const handleMenuSave = () => {
    const price = parseFloat(menuFormData.price)
    if (!menuFormData.name.trim() || isNaN(price) || price <= 0 || menuFormData.items.length === 0) return

    const menu: Menu = {
      id: editingMenu?.id || generateId(),
      name: menuFormData.name.trim(),
      price,
      items: menuFormData.items,
      image: menuFormData.image,
      active: menuFormData.active,
      createdAt: editingMenu?.createdAt || new Date().toISOString(),
    }

    saveMenu(menu)
    refreshData()
    setMenuDialogOpen(false)
  }

  const confirmDeleteMenu = (menu: Menu) => {
    setMenuToDelete(menu)
    setDeleteMenuDialogOpen(true)
  }

  const handleDeleteMenu = () => {
    if (menuToDelete) {
      deleteMenu(menuToDelete.id)
      refreshData()
      setDeleteMenuDialogOpen(false)
      setMenuToDelete(null)
    }
  }

  const toggleMenuActive = (menu: Menu) => {
    saveMenu({ ...menu, active: !menu.active })
    refreshData()
  }

  const addProductToMenu = (productId: string) => {
    setMenuFormData((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.productId === productId)
      if (existingIndex >= 0) {
        const newItems = [...prev.items]
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 }
        return { ...prev, items: newItems }
      }
      return { ...prev, items: [...prev.items, { productId, quantity: 1 }] }
    })
  }

  const removeProductFromMenu = (productId: string) => {
    setMenuFormData((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.productId === productId)
      if (existingIndex >= 0 && prev.items[existingIndex].quantity > 1) {
        const newItems = [...prev.items]
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity - 1 }
        return { ...prev, items: newItems }
      }
      return { ...prev, items: prev.items.filter((item) => item.productId !== productId) }
    })
  }

  const getProductQuantityInMenu = (productId: string) => {
    return menuFormData.items.find((item) => item.productId === productId)?.quantity || 0
  }

  const getTotalMenuItems = () => {
    return menuFormData.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getProductById = (id: string) => products.find((p) => p.id === id)

  // Category functions
  const openNewCategoryDialog = () => {
    setEditingCategory(null)
    setCategoryFormData({ name: '', color: 'bg-orange-500' })
    setCategoryDialogOpen(true)
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      color: category.color,
    })
    setCategoryDialogOpen(true)
  }

  const handleCategorySave = () => {
    if (!categoryFormData.name.trim()) return

    const category: Category = {
      id: editingCategory?.id || generateId(),
      name: categoryFormData.name.trim(),
      color: categoryFormData.color,
    }

    saveCategory(category)
    refreshData()
    setCategoryDialogOpen(false)
  }

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteCategoryDialogOpen(true)
  }

  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id)
      refreshData()
      setDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const groupedProducts = products.reduce(
    (acc, product) => {
      if (!acc[product.categoryId]) acc[product.categoryId] = []
      acc[product.categoryId].push(product)
      return acc
    },
    {} as Record<string, Product[]>
  )

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ürünler & Menüler</h1>
          <p className="text-muted-foreground">Ürünlerinizi ve menülerinizi yönetin</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="products">Ürünler</TabsTrigger>
          <TabsTrigger value="menus">Menüler</TabsTrigger>
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="flex-1 flex flex-col gap-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={openNewDialog} size="lg" className="h-12">
              <Plus className="w-5 h-5 mr-2" />
              Ürün Ekle
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-8 pr-4">
              {categories.map((category) => {
                const categoryProducts = groupedProducts[category.id] || []
                if (categoryProducts.length === 0) return null
                return (
                  <div key={category.id}>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${category.color}`} />
                      {category.name}
                      <Badge variant="secondary" className="font-normal">
                        {categoryProducts.length}
                      </Badge>
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {categoryProducts.map((product) => (
                        <Card key={product.id} className={`p-4 ${!product.active ? 'opacity-50' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {product.image ? (
                                <Image
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-card-foreground truncate">{product.name}</h3>
                                <Badge 
                                  variant="secondary"
                                  className={`${category.color} text-white`}
                                >
                                  {category.name}
                                </Badge>
                              </div>
                              <div className="text-xl font-semibold text-primary">₺{product.price.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={product.active} onCheckedChange={() => toggleActive(product)} />
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => confirmDelete(product)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Henüz ürün yok</p>
                  <Button onClick={openNewDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Ürününüzü Ekleyin
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="menus" className="flex-1 flex flex-col gap-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={openNewMenuDialog} size="lg" className="h-12">
              <Plus className="w-5 h-5 mr-2" />
              Menü Oluştur
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {menus.map((menu) => {
                const menuItems = menu.items || []
                const totalItems = menuItems.reduce((sum, item) => sum + item.quantity, 0)
                return (
                  <Card key={menu.id} className={`p-4 ${!menu.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {menu.image ? (
                          <Image
                            src={menu.image || "/placeholder.svg"}
                            alt={menu.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-card-foreground truncate">{menu.name}</h3>
                          <Badge variant="secondary">{totalItems} ürün</Badge>
                        </div>
                        <div className="text-xl font-semibold text-primary mb-2">₺{menu.price.toFixed(2)}</div>
                        <div className="flex flex-wrap gap-1">
                          {menuItems.slice(0, 3).map((item) => {
                            const p = getProductById(item.productId)
                            return p ? (
                              <Badge key={item.productId} variant="outline" className="text-xs">
                                {item.quantity > 1 && `${item.quantity}x `}{p.name}
                              </Badge>
                            ) : null
                          })}
                          {menuItems.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{menuItems.length - 3} daha fazla
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={menu.active} onCheckedChange={() => toggleMenuActive(menu)} />
                        <Button variant="ghost" size="icon" onClick={() => openEditMenuDialog(menu)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDeleteMenu(menu)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
              {menus.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <p className="text-muted-foreground mb-4">Henüz menü yok</p>
                  <Button onClick={openNewMenuDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Menünüzü Oluşturun
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="categories" className="flex-1 flex flex-col gap-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={openNewCategoryDialog} size="lg" className="h-12">
              <Plus className="w-5 h-5 mr-2" />
              Kategori Ekleyin
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-3 gap-4 pr-4">
              {categories.map((category) => {
                const productCount = (groupedProducts[category.id] || []).length
                return (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground truncate">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{productCount} ürün</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditCategoryDialog(category)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => confirmDeleteCategory(category)}
                          disabled={productCount > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
              {categories.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <p className="text-muted-foreground mb-4">No categories yet</p>
                  <Button onClick={openNewCategoryDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Category
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {formData.image ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden">
                    <Image
                      src={formData.image || "/placeholder.svg"}
                      alt="Product"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="product-image" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Görsel Yükle</span>
                  </Button>
                </Label>
                <Input id="product-image" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Classic Burger"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Aktif</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>{editingProduct ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Menu Dialog */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMenu ? 'Menüyü Düzenle' : 'Yeni Menü Oluştur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {menuFormData.image ? (
                    <div className="w-24 h-24 rounded-xl overflow-hidden">
                      <Image
                        src={menuFormData.image || "/placeholder.svg"}
                        alt="Menu"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="menu-image" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>Görsel Yükle</span>
                    </Button>
                  </Label>
                  <Input
                    id="menu-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMenuImageUpload}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="menu-name">Menü Adı</Label>
                  <Input
                    id="menu-name"
                    value={menuFormData.name}
                    onChange={(e) => setMenuFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Burger Combo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menu-price">Menu Fiyatı</Label>
                  <Input
                    id="menu-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuFormData.price}
                    onChange={(e) => setMenuFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="menu-active">Aktif</Label>
                  <Switch
                    id="menu-active"
                    checked={menuFormData.active}
                    onCheckedChange={(checked) => setMenuFormData((prev) => ({ ...prev, active: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ürünleri Seç ({getTotalMenuItems()} selected)</Label>
              <ScrollArea className="h-56 border rounded-lg p-3">
                <div className="space-y-2">
                  {products.map((product) => {
                    const quantity = getProductQuantityInMenu(product.id)
                    const category = getCategoryById(product.categoryId)
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground">₺{product.price.toFixed(2)}</div>
                        </div>
                        {category && (
                          <Badge className={`${category.color} text-white`} variant="secondary">
                            {category.name}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => removeProductFromMenu(product.id)}
                            disabled={quantity === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => addProductToMenu(product.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {products.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      Ürün bulunamadı. Önce ürün ekleyin.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {menuFormData.items.length > 0 && (
              <div className="space-y-2">
                <Label>Menu Contents</Label>
                <div className="flex flex-wrap gap-2">
                  {menuFormData.items.map((item) => {
                    const p = getProductById(item.productId)
                    return p ? (
                      <Badge key={item.productId} variant="secondary" className="text-sm py-1 px-3">
                        {item.quantity}x {p.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleMenuSave} disabled={menuFormData.items.length === 0}>
              {editingMenu ? 'Değişiklikleri Kaydet' : 'Yeni Menü Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Kategori Adı</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Appetizers"
              />
            </div>
            <div className="space-y-2">
              <Label>Renk</Label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setCategoryFormData((prev) => ({ ...prev, color: color.value }))}
                    className={`h-12 rounded-lg ${color.value} flex items-center justify-center text-white text-sm font-medium transition-all ${
                      categoryFormData.color === color.value ? 'ring-2 ring-offset-2 ring-foreground' : ''
                    }`}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCategorySave}>{editingCategory ? 'Değişiklikleri Kaydet' : 'Kategori Ekle'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{productToDelete?.name}&quot; adlı ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Menu Confirmation */}
      <AlertDialog open={deleteMenuDialogOpen} onOpenChange={setDeleteMenuDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{menuToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMenu}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
