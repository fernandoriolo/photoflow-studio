import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTransactions, useFinanceSummary, useFinanceCategories, useCreateTransaction, useDeleteTransaction } from '@/hooks/useFinance';
import type { TransactionType, TransactionStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  MoreHorizontal,
  Trash2,
  Filter,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusLabels: Record<TransactionStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

const statusColors: Record<TransactionStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Financas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: '',
    status: 'paid' as TransactionStatus,
    notes: '',
  });

  const currentMonth = {
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  };

  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(
    filterType !== 'all' ? { type: filterType } : undefined
  );
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary(currentMonth);
  const { data: incomeCategories = [] } = useFinanceCategories('income');
  const { data: expenseCategories = [] } = useFinanceCategories('expense');
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const isLoading = transactionsLoading || summaryLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTransaction.mutateAsync({
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: transactionType,
        category_id: formData.category_id || null,
        date: formData.date,
        payment_method: formData.payment_method || null,
        status: formData.status,
        notes: formData.notes || null,
      });
      
      toast.success('Transação criada com sucesso!');
      setIsDialogOpen(false);
      setFormData({
        description: '',
        amount: '',
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: '',
        status: 'paid',
        notes: '',
      });
    } catch (error) {
      toast.error('Erro ao criar transação');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      toast.success('Transação excluída');
    } catch (error) {
      toast.error('Erro ao excluir transação');
    }
  };

  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

  if (isLoading) {
    return (
      <DashboardLayout title="Finanças" subtitle="Gerencie suas finanças">
        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Finanças"
      subtitle="Gerencie as finanças do seu negócio"
    >
      <div className="space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas do Mês</p>
                  <p className="text-2xl font-semibold text-success">
                    {formatCurrency(summary?.income || 0)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                  <p className="text-2xl font-semibold text-destructive">
                    {formatCurrency(summary?.expense || 0)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Mês</p>
                  <p className={cn(
                    'text-2xl font-semibold',
                    (summary?.balance || 0) >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {formatCurrency(summary?.balance || 0)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Wallet className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={(v) => setFilterType(v as TransactionType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setTransactionType('expense')}
                >
                  <ArrowDownCircle className="h-4 w-4 text-destructive" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  className="gap-2"
                  onClick={() => setTransactionType('income')}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Nova Receita
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {transactionType === 'income' ? (
                      <>
                        <ArrowUpCircle className="h-5 w-5 text-success" />
                        Nova Receita
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        Nova Despesa
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Ensaio fotográfico"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v as TransactionStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observações opcionais..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createTransaction.isPending}>
                      {createTransaction.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                          )}>
                            {transaction.type === 'income' ? (
                              <ArrowUpCircle className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <span className="font-medium">{transaction.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {transaction.category?.name || 'Sem categoria'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border', statusColors[transaction.status as TransactionStatus])}>
                          {statusLabels[transaction.status as TransactionStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-semibold',
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground">Nenhuma transação</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adicione sua primeira receita ou despesa
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

