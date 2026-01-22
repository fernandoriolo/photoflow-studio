import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { NewClientModal } from '@/components/clients/NewClientModal';
import { ClientCard } from '@/components/clients/ClientCard';

export default function Clientes() {
  const { data: clients = [], isLoading, error: clientsError } = useClients();
  const { data: projects = [], error: projectsError } = useProjects();

  if (clientsError) console.error('Erro ao carregar clientes:', clientsError);
  if (projectsError) console.error('Erro ao carregar projetos:', projectsError);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

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

  const projectCountByClient = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((project) => {
      if (project.client_id) {
        counts[project.client_id] = (counts[project.client_id] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

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
          <Button className="gap-2" onClick={() => setIsNewClientModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              projectCount={projectCountByClient[client.id] || 0}
            />
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

      {/* Modal de Novo Cliente */}
      <NewClientModal
        open={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />
    </DashboardLayout>
  );
}
