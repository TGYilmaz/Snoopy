// app/accounts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAccountStore } from '@/lib/pos-store-extended';
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
import {
  Plus,
  Search,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import {
  ACCOUNT_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/pos-types-extended';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AccountsPage() {
  const {
    accounts,
    loading,
    fetchAccounts,
    deleteAccount,
  } = useAccountStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || account.account_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalReceivables = accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalPayables = accounts
    .filter((a) => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const handleDelete = async (id: string) => {
    if (confirm('Bu cari hesabı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteAccount(id);
      } catch (error) {
        console.error('Cari hesap silinirken hata:', error);
      }
    }
  };

  const handleViewDetails = (account: any) => {
    setSelectedAccount(account);
    setIsDetailDialogOpen(true);
  };

  const handlePayment = (account: any) => {
    setSelectedAccount(account);
    setIsPaymentDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Cari Hesap Yönetimi</h1>
            <p className="text-muted-foreground">Müşteri ve tedarikçi takibi</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Cari Hesap
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <AccountForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Cari</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">Aktif cari hesaplar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteriler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter((a) => a.account_type === 'customer').length}
            </div>
            <p className="text-xs text-muted-foreground">Müşteri sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alacaklar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ₺{totalReceivables.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Toplam alacak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borçlar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ₺{totalPayables.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Toplam borç</p>
          </CardContent>
        </Card>
      </div>

      {/* Cari Hesap Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Cari Hesap Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tür seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="customer">Müşteri</SelectItem>
                <SelectItem value="supplier">Tedarikçi</SelectItem>
                <SelectItem value="both">Her İkisi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                  <TableHead className="text-right">Kredi Limiti</TableHead>
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
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Cari hesap bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ACCOUNT_TYPE_LABELS[account.account_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            account.balance > 0
                              ? 'text-green-600 font-semibold'
                              : account.balance < 0
                              ? 'text-red-600 font-semibold'
                              : ''
                          }
                        >
                          ₺{account.balance.toFixed(2)}
                          {account.balance > 0 && ' (Alacak)'}
                          {account.balance < 0 && ' (Borç)'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ₺{account.credit_limit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(account)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePayment(account)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
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

      {/* Cari Detay Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <AccountDetails
            account={selectedAccount}
            onClose={() => {
              setIsDetailDialogOpen(false);
              setSelectedAccount(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Ödeme Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <PaymentForm
            account={selectedAccount}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setSelectedAccount(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Cari Hesap Formu
function AccountForm({ onClose, account }: { onClose: () => void; account?: any }) {
  const { addAccount, updateAccount } = useAccountStore();
  const [formData, setFormData] = useState({
    code: account?.code || '',
    name: account?.name || '',
    account_type: account?.account_type || 'customer',
    phone: account?.phone || '',
    email: account?.email || '',
    address: account?.address || '',
    tax_number: account?.tax_number || '',
    tax_office: account?.tax_office || '',
    credit_limit: account?.credit_limit || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasyon
    if (!formData.code || !formData.name) {
      alert('Kod ve Ad alanları zorunludur');
      return;
    }

    try {
      if (account) {
        await updateAccount(account.id, formData);
      } else {
        await addAccount({
          ...formData,
          balance: 0, // Yeni hesap için başlangıç bakiyesi 0
        });
      }
      onClose();
    } catch (error) {
      console.error('Hata:', error);
      alert('Kaydetme sırasında bir hata oluştu');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {account ? 'Cari Hesap Düzenle' : 'Yeni Cari Hesap'}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Kod</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="M001, T001"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tip</label>
          <Select
            value={formData.account_type}
            onValueChange={(value) =>
              setFormData({ ...formData, account_type: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Müşteri</SelectItem>
              <SelectItem value="supplier">Tedarikçi</SelectItem>
              <SelectItem value="both">Her İkisi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Ad</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Telefon</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">E-posta</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Adres</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Vergi No</label>
          <Input
            value={formData.tax_number}
            onChange={(e) =>
              setFormData({ ...formData, tax_number: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">Vergi Dairesi</label>
          <Input
            value={formData.tax_office}
            onChange={(e) =>
              setFormData({ ...formData, tax_office: e.target.value })
            }
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Kredi Limiti</label>
          <Input
            type="number"
            step="0.01"
            value={formData.credit_limit}
            onChange={(e) =>
              setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit">{account ? 'Güncelle' : 'Ekle'}</Button>
      </div>
    </form>
  );
}

// Cari Detay Bileşeni
function AccountDetails({
  account,
  onClose,
}: {
  account: any;
  onClose: () => void;
}) {
  const { accountTransactions, fetchAccountTransactions } = useAccountStore();

  useEffect(() => {
    if (account) {
      fetchAccountTransactions(account.id);
    }
  }, [account]);

  if (!account) return null;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{account.name} - Cari Detayları</DialogTitle>
      </DialogHeader>

      {/* Cari Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Cari Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Kod</p>
            <p className="font-medium">{account.code}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tip</p>
            <Badge>{ACCOUNT_TYPE_LABELS[account.account_type]}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefon</p>
            <p className="font-medium">{account.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">E-posta</p>
            <p className="font-medium">{account.email || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Adres</p>
            <p className="font-medium">{account.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bakiye</p>
            <p
              className={`text-lg font-bold ${
                account.balance > 0
                  ? 'text-green-600'
                  : account.balance < 0
                  ? 'text-red-600'
                  : ''
              }`}
            >
              ₺{account.balance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kredi Limiti</p>
            <p className="text-lg font-bold">₺{account.credit_limit.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Hesap Hareketleri */}
      <Card>
        <CardHeader>
          <CardTitle>Hesap Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {accountTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Henüz hareket yok
              </p>
            ) : (
              accountTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-2 p-3 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', {
                          locale: tr,
                        })}
                      </p>
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                      )}
                      {transaction.reference_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Sipariş No: #{transaction.reference_id.substring(0, 8)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          ['sale', 'receipt'].includes(transaction.transaction_type)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {['sale', 'receipt'].includes(transaction.transaction_type)
                          ? '+'
                          : '-'}
                        ₺{transaction.amount.toFixed(2)}
                      </p>
                      {transaction.payment_method && (
                        <Badge variant="outline" className="mt-1">
                          {PAYMENT_METHOD_LABELS[transaction.payment_method as any]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sipariş içeriğini göster */}
                  {transaction.reference_type === 'order' && transaction.reference_id && (
                    <OrderContent orderId={transaction.reference_id} />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onClose}>Kapat</Button>
      </div>
    </div>
  );
}

// Ödeme Formu
function PaymentForm({ account, onClose }: { account: any; onClose: () => void }) {
  const { addTransaction } = useAccountStore();
  const [formData, setFormData] = useState({
    transaction_type: 'payment' as any,
    amount: 0,
    payment_method: 'cash' as any,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTransaction({
        account_id: account.id,
        ...formData,
      });
      onClose();
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Ödeme/Tahsilat</DialogTitle>
        <p className="text-sm text-muted-foreground">
          {account.name} - Güncel Bakiye: ₺{account.balance.toFixed(2)}
        </p>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">İşlem Tipi</label>
          <Select
            value={formData.transaction_type}
            onValueChange={(value) =>
              setFormData({ ...formData, transaction_type: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment">Ödeme (Borç Öde)</SelectItem>
              <SelectItem value="receipt">Tahsilat (Alacak Al)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Tutar</label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) })
            }
            required
            min="0.01"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Ödeme Yöntemi</label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) =>
              setFormData({ ...formData, payment_method: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Nakit</SelectItem>
              <SelectItem value="card">Kredi Kartı</SelectItem>
              <SelectItem value="transfer">Havale/EFT</SelectItem>
              <SelectItem value="check">Çek</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Açıklama</label>
          <Input
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
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

// Sipariş İçeriği Gösterimi
function OrderContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { getOrders } = await import('@/lib/pos-store');
        const orders = await getOrders();
        const foundOrder = orders.find((o: any) => o.id === orderId);
        setOrder(foundOrder);
      } catch (error) {
        console.error('Sipariş yüklenemedi:', error);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return null;

  return (
    <div className="mt-2 p-2 bg-muted/50 rounded-md">
      <p className="text-xs font-medium mb-1">Sipariş İçeriği:</p>
      <div className="space-y-1">
        {order.items.map((item: any, index: number) => (
          <div key={index} className="text-xs text-muted-foreground">
            {item.quantity}x {item.productName} - ₺{item.totalPrice.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
