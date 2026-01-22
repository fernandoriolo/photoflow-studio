import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuotes } from '@/hooks/useQuotes';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Plus, Send, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function Orcamentos() {
  const [showForm, setShowForm] = useState(false);
  const { data: quotes = [], isLoading } = useQuotes();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Orçamentos"
        subtitle="Crie e gerencie seus orçamentos"
      >
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Orçamentos"
      subtitle="Crie e gerencie seus orçamentos"
    >
      <div className="space-y-6 p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {quotes.length} orçamento(s) criado(s)
          </p>
          <Button className="gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>

        {/* Quote Form */}
        {showForm && (
          <Card className="border-0 shadow-medium animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-display">
                Criar Novo Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input id="clientName" placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">E-mail</Label>
                  <Input id="clientEmail" type="email" placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Tipo de Evento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casamento">Casamento</SelectItem>
                      <SelectItem value="ensaio">Ensaio</SelectItem>
                      <SelectItem value="aniversario">Aniversário</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Data do Evento</Label>
                  <Input id="eventDate" type="date" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Itens do Orçamento</Label>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-24">Qtd</TableHead>
                      <TableHead className="w-32">Valor Unit.</TableHead>
                      <TableHead className="w-32 text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Input placeholder="Descrição do item" className="border-0 bg-transparent p-0" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" defaultValue={1} className="border-0 bg-transparent p-0 w-16" />
                      </TableCell>
                      <TableCell>
                        <Input placeholder="R$ 0,00" className="border-0 bg-transparent p-0" />
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ 0,00</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Condições de pagamento, informações adicionais..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total do Orçamento</p>
                  <p className="text-2xl font-display font-semibold text-foreground">
                    R$ 0,00
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button className="gap-2">
                    <Send className="h-4 w-4" />
                    Salvar e Enviar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotes List */}
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {quote.client_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {quote.event_type} •{' '}
                        {quote.event_date &&
                          format(new Date(quote.event_date), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">
                          {quote.items?.length || 0} itens
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Válido até{' '}
                          {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-xl font-display font-semibold text-foreground">
                        {formatCurrency(quote.total_value)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                      <Button size="sm" className="gap-2">
                        <Send className="h-4 w-4" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {quotes.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Nenhum orçamento criado
            </h3>
            <p className="mt-1 text-muted-foreground">
              Crie seu primeiro orçamento clicando no botão acima
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
