// app/recipes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRecipeStore } from '@/lib/pos-store-extended';
import { useStockStore } from '@/lib/pos-store-extended';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, ChefHat, X } from 'lucide-react';
import { STOCK_UNIT_LABELS } from '@/lib/pos-types-extended';

export default function RecipesPage() {
  const { recipes, loading, fetchRecipes, deleteRecipe } = useRecipeStore();
  const { stocks, fetchStocks } = useStockStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  useEffect(() => {
    fetchRecipes();
    fetchStocks();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Bu reçeteyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteRecipe(id);
      } catch (error) {
        console.error('Reçete silinirken hata:', error);
      }
    }
  };

  const handleEdit = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reçete Yönetimi</h1>
          <p className="text-muted-foreground">
            Ürün reçeteleri ve hammadde takibi
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setSelectedRecipe(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Reçete Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <RecipeForm
              recipe={selectedRecipe}
              stocks={stocks}
              onClose={() => {
                setIsAddDialogOpen(false);
                setSelectedRecipe(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Reçete</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.length}</div>
            <p className="text-xs text-muted-foreground">Aktif reçeteler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Üretim Ürünleri</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(recipes.map((r) => r.product_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Reçeteli ürün sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Hammadde</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stocks.filter((s) => s.category === 'raw_material').length}
            </div>
            <p className="text-xs text-muted-foreground">Kullanılabilir hammadde</p>
          </CardContent>
        </Card>
      </div>

      {/* Reçete Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Reçete Listesi</CardTitle>
          <CardDescription>
            Ürün reçetelerini görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz reçete eklenmemiş
              </div>
            ) : (
              recipes.map((recipe) => (
                <Card key={recipe.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        <CardDescription>
                          {recipe.product?.name} -{' '}
                          <Badge variant="outline">
                            {recipe.output_quantity}{' '}
                            {STOCK_UNIT_LABELS[recipe.output_unit]}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(recipe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipe.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Hammaddeler:</p>
                      <div className="grid gap-2">
                        {recipe.recipe_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted"
                          >
                            <span className="text-sm">{item.material?.name}</span>
                            <Badge variant="secondary">
                              {item.quantity} {STOCK_UNIT_LABELS[item.unit]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Reçete Formu Bileşeni
function RecipeForm({
  recipe,
  stocks,
  onClose,
}: {
  recipe?: any;
  stocks: any[];
  onClose: () => void;
}) {
  const { addRecipe, updateRecipe } = useRecipeStore();

  const finishedProducts = stocks.filter(
    (s) => s.category === 'finished_product' || s.category === 'semi_finished'
  );
  const rawMaterials = stocks.filter(
    (s) => s.category === 'raw_material' || s.category === 'semi_finished'
  );

  const [formData, setFormData] = useState({
    product_id: recipe?.product_id || '',
    name: recipe?.name || '',
    output_quantity: recipe?.output_quantity || 1,
    output_unit: recipe?.output_unit || 'piece',
    items: recipe?.recipe_items?.map((item: any) => ({
      material_id: item.material_id,
      quantity: item.quantity,
      unit: item.unit,
    })) || [],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { material_id: '', quantity: 0, unit: 'piece' as any },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.name || formData.items.length === 0) {
      alert('Lütfen tüm alanları doldurun ve en az bir hammadde ekleyin');
      return;
    }

    try {
      if (recipe) {
        await updateRecipe(recipe.id, formData);
      } else {
        await addRecipe(formData);
      }
      onClose();
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{recipe ? 'Reçete Düzenle' : 'Yeni Reçete Ekle'}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Ana Bilgiler */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium">Reçete Adı</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Türk Kahvesi Reçetesi"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">Ürün Seçin</label>
            <Select
              value={formData.product_id}
              onValueChange={(value) =>
                setFormData({ ...formData, product_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Ürün seçin" />
              </SelectTrigger>
              <SelectContent>
                {finishedProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Çıktı Miktarı</label>
            <Input
              type="number"
              step="0.001"
              value={formData.output_quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  output_quantity: parseFloat(e.target.value),
                })
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Çıktı Birimi</label>
            <Select
              value={formData.output_unit}
              onValueChange={(value) =>
                setFormData({ ...formData, output_unit: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STOCK_UNIT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hammaddeler */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Hammaddeler</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Hammadde Ekle
            </Button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Henüz hammadde eklenmemiş
            </div>
          ) : (
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-3 border rounded-lg"
                >
                  <div className="col-span-6">
                    <Select
                      value={item.material_id}
                      onValueChange={(value) =>
                        updateItem(index, 'material_id', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hammadde seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Miktar"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STOCK_UNIT_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit">{recipe ? 'Güncelle' : 'Ekle'}</Button>
      </div>
    </form>
  );
}
