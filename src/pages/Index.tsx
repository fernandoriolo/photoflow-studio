import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { RecentLeads } from '@/components/dashboard/RecentLeads';
import { useLeads } from '@/hooks/useLeads';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useProjects } from '@/hooks/useProjects';
import { Users, DollarSign, Camera, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: calendarEvents = [], isLoading: eventsLoading, error: eventsError } = useCalendarEvents();
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects();

  // Log de erros para debug
  if (leadsError) console.error('Erro ao carregar leads:', leadsError);
  if (eventsError) console.error('Erro ao carregar eventos:', eventsError);
  if (projectsError) console.error('Erro ao carregar projetos:', projectsError);

  // Considerar como carregado se tiver erro (para não ficar em loading infinito)
  const hasError = leadsError || eventsError || projectsError;
  const isLoading = !hasError && (leadsLoading || eventsLoading || projectsLoading);

  // Calculate stats
  const totalLeads = leads.length;
  const closedDeals = leads.filter((l) => l.status === 'closed').length;
  const totalRevenue = leads
    .filter((l) => l.status === 'closed')
    .reduce((sum, l) => sum + (l.value || 0), 0);
  const activeProjects = projects.filter(
    (p) => p.status !== 'delivered'
  ).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Bem-vindo ao seu painel de controle"
      >
        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Bem-vindo ao seu painel de controle"
    >
      <div className="space-y-6 p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Leads"
            value={totalLeads}
            subtitle="leads no pipeline"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Contratos Fechados"
            value={closedDeals}
            subtitle="este mês"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Receita Confirmada"
            value={formatCurrency(totalRevenue)}
            subtitle="contratos fechados"
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Projetos Ativos"
            value={activeProjects}
            subtitle="em andamento"
            icon={Camera}
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingEvents events={calendarEvents} />
          <RecentLeads leads={leads} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
