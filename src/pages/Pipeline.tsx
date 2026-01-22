import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function Pipeline() {
  return (
    <DashboardLayout
      title="Pipeline de Leads"
      subtitle="Gerencie seus leads e oportunidades"
    >
      <KanbanBoard />
    </DashboardLayout>
  );
}
