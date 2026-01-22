import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { RecentLeads } from '@/components/dashboard/RecentLeads';
import { mockLeads, mockCalendarEvents, mockProjects } from '@/data/mockData';
import { Users, DollarSign, Camera, TrendingUp } from 'lucide-react';

const Index = () => {
  // Calculate stats
  const totalLeads = mockLeads.length;
  const closedDeals = mockLeads.filter((l) => l.status === 'closed').length;
  const totalRevenue = mockLeads
    .filter((l) => l.status === 'closed')
    .reduce((sum, l) => sum + (l.value || 0), 0);
  const activeProjects = mockProjects.filter(
    (p) => p.status !== 'delivered'
  ).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
          <UpcomingEvents events={mockCalendarEvents} />
          <RecentLeads leads={mockLeads} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
