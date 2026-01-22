import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Plus, Search, MoreHorizontal, Eye, Edit, Camera } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientProfileModal } from '@/components/clients/ClientProfileModal';
import type { Client } from '@/types/database';

export default function Clientes() {
  const { data: clients = [], isLoading, error: clientsError } = useClients();
  const { data: projects = [], error: projectsError } = useProjects();

  // Log de erros para debug
  if (clientsError) console.error('Erro ao carregar clientes:', clientsError);
  if (projectsError) console.error('Erro ao carregar projetos:', projectsError);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Filtrar clientes pela busca
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Contar projetos por cliente
  const projectCountByClient = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((project) => {
      if (project.client_id) {
        counts[project.client_id] = (counts[project.client_id] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
    setSelectedClient(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading && !clientsError) {
    return (
      <DashboardLayout
        title="Clientes"
        subtitle="Gerencie sua base de clientes"
      >
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="border-0 shadow-soft transition-all hover:shadow-medium"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-border">
                      <AvatarImage src={client.avatar_url || undefined} />
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
                        {client.created_at && format(new Date(client.created_at), "MMM 'de' yyyy", {
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
                      <DropdownMenuItem onClick={() => handleViewProfile(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewProfile(client)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Ver projetos
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{client.email}</span>
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
                    <Badge variant="secondary">
                      {projectCountByClient[client.id] || 0} projeto{(projectCountByClient[client.id] || 0) !== 1 ? 's' : ''}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewProfile(client)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && clients.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Nenhum cliente encontrado
            </h3>
            <p className="mt-1 text-muted-foreground">
              Tente buscar por outro nome, email ou telefone
            </p>
          </div>
        )}

        {clients.length === 0 && (
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

      {/* Modal de Perfil do Cliente */}
      <ClientProfileModal
        client={selectedClient}
        open={isProfileModalOpen}
        onClose={handleCloseProfile}
      />
    </DashboardLayout>
  );
}
