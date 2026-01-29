// app/stocks/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  DialogDescription,
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
import {
  AlertCircle,
  Package,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
} from 'lucide-react';
import { STOCK_CATEGORY_LABELS, STOCK_UNIT_LABELS } from '@/lib/pos-types-extended';

export default function StocksPage() {
  const {
    stocks,
    lowStockItems,
    loading,
    fetchStocks,
    fetchLowStockItems,
    deleteStock,
  } = useStockStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStockMovementDialogOpen, setIsStockMovementDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  useEffect(() => {
    fetchStocks();
    fetchLowStockItems();
  }, []);

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || stock.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Bu stoğu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteStock(id);
      } catch (error) {
        console.error('Stok silinirken hata:', error);
      }
    }
  };

  const handleStockMovement = (stock: any, type: 'in' | 'out') => {
    setSelectedStock({ ...stock, movementType: type });
    setIsStockMovementDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Başlık ve Özet Kartları */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stok Yönetimi</h1>
          <p className="text-muted-foreground">Stok takibi ve yönetimi</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Stok Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <StockForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Stok Kalemi</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stocks.length}</div>
            <p className="text-xs text-muted-foreground">Aktif stok kalemleri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Stoklar</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground">Minimum seviyenin altında</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{stocks
                .reduce((sum, s) => sum + s.current_quantity * s.cost_price, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Maliyet bazında</p>
          </CardContent>
        </Card>
      </div>

      {/* Kritik Stok Uyarısı */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <AlertCircle className="mr-2 h-5 w-5" />
              Kritik Stok Uyarısı
            </CardTitle>
            <CardDescription>
              Aşağıdaki ürünler minimum stok seviyesinin altında
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-orange-50"
                >
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-orange-600">
                    {item.current_quantity} {STOCK_UNIT_LABELS[item.unit]} (Min:{' '}
                    {item.minimum_quantity})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Stok Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Stok ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategori seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="raw_material">Hammadde</SelectItem>
                <SelectItem value="semi_finished">Yarı Mamul</SelectItem>
                <SelectItem value="finished_product">Mamul</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stok Tablosu */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Mevcut Miktar</TableHead>
                  <TableHead className="text-right">Min. Miktar</TableHead>
                  <TableHead className="text-right">Maliyet</TableHead>
                  <TableHead className="text-right">Satış Fiyatı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Stok bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {STOCK_CATEGORY_LABELS[stock.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            stock.current_quantity <= stock.minimum_quantity
                              ? 'text-orange-600 font-bold'
                              : ''
                          }
                        >
                          {stock.current_quantity} {STOCK_UNIT_LABELS[stock.unit]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {stock.minimum_quantity} {STOCK_UNIT_LABELS[stock.unit]}
                      </TableCell>
                      <TableCell className="text-right">
                        ₺{stock.cost_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₺{stock.sell_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockMovement(stock, 'in')}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockMovement(stock, 'out')}
                          >
                            <TrendingDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stock.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stok Hareket Dialog'u */}
      <Dialog
        open={isStockMovementDialogOpen}
        onOpenChange={setIsStockMovementDialogOpen}
      >
        <DialogContent>
          <StockMovementForm
            stock={selectedStock}
            onClose={() => {
              setIsStockMovementDialogOpen(false);
              setSelectedStock(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stok Ekleme Formu Bileşeni (ayrı dosya olarak da oluşturulabilir)
function StockForm({ onClose, stock }: { onClose: () => void; stock?: any }) {
  const { addStock, updateStock } = useStockStore();
  const [formData, setFormData] = useState({
    name: stock?.name || '',
    category: stock?.category || 'finished_product',
    unit: stock?.unit || 'piece',
    current_quantity: stock?.current_quantity || 0,
    minimum_quantity: stock?.minimum_quantity || 0,
    cost_price: stock?.cost_price || 0,
    sell_price: stock?.sell_price || 0,
    barcode: stock?.barcode || '',
    description: stock?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (stock) {
        await updateStock(stock.id, formData);
      } else {
        await addStock(formData);
      }
      onClose();
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{stock ? 'Stok Düzenle' : 'Yeni Stok Ekle'}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium">Ürün Adı</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Kategori</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw_material">Hammadde</SelectItem>
              <SelectItem value="semi_finished">Yarı Mamul</SelectItem>
              <SelectItem value="finished_product">Mamul</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Birim</label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value as any })}
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

        <div>
          <label className="text-sm font-medium">Mevcut Miktar</label>
          <Input
            type="number"
            step="0.001"
            value={formData.current_quantity}
            onChange={(e) =>
              setFormData({ ...formData, current_quantity: parseFloat(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">Minimum Miktar</label>
          <Input
            type="number"
            step="0.001"
            value={formData.minimum_quantity}
            onChange={(e) =>
              setFormData({ ...formData, minimum_quantity: parseFloat(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">Maliyet Fiyatı</label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost_price}
            onChange={(e) =>
              setFormData({ ...formData, cost_price: parseFloat(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">Satış Fiyatı</label>
          <Input
            type="number"
            step="0.01"
            value={formData.sell_price}
            onChange={(e) =>
              setFormData({ ...formData, sell_price: parseFloat(e.target.value) })
            }
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Barkod (Opsiyonel)</label>
          <Input
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit">{stock ? 'Güncelle' : 'Ekle'}</Button>
      </div>
    </form>
  );
}

// Stok Hareket Formu
function StockMovementForm({
  stock,
  onClose,
}: {
  stock: any;
  onClose: () => void;
}) {
  const { addStockMovement } = useStockStore();
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addStockMovement({
        stock_id: stock.id,
        movement_type: stock.movementType,
        quantity,
        notes,
      });
      onClose();
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          Stok {stock?.movementType === 'in' ? 'Girişi' : 'Çıkışı'}
        </DialogTitle>
        <DialogDescription>
          {stock?.name} - Mevcut: {stock?.current_quantity} {STOCK_UNIT_LABELS[stock?.unit]}
        </DialogDescription>
      </DialogHeader>

      <div>
        <label className="text-sm font-medium">Miktar</label>
        <Input
          type="number"
          step="0.001"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value))}
          required
          min="0.001"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Not (Opsiyonel)</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit">Kaydet</Button>
      </div>
    </form>
  );
}
