import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockClients } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Plus, Search, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Clientes() {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout
      title="Clientes"
      subtitle="Gerencie sua base de clientes"
    >
      <div className="space-y-6 p-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="w-full pl-9 sm:w-80 bg-card border-0 shadow-soft"
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockClients.map((client) => (
            <Card
              key={client.id}
              className="border-0 shadow-soft transition-all hover:shadow-medium"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-border">
                      <AvatarFallback className="bg-secondary text-lg font-medium text-secondary-foreground">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {client.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Cliente desde{' '}
                        {format(new Date(client.createdAt), "MMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ver projetos</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">2 projetos</Badge>
                    <Button variant="ghost" size="sm">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockClients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Nenhum cliente cadastrado
            </h3>
            <p className="mt-1 text-muted-foreground">
              Adicione seu primeiro cliente clicando no botão acima
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
