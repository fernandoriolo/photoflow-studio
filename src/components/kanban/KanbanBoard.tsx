import { useState } from 'react';
import { Lead, LeadStatus } from '@/types';
import { mockLeads } from '@/data/mockData';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const columns: { status: LeadStatus; title: string }[] = [
  { status: 'new', title: 'Novos' },
  { status: 'negotiation', title: 'Em Negociação' },
  { status: 'sent', title: 'Orçamento Enviado' },
  { status: 'closed', title: 'Fechados' },
];

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const getTotalValue = (status: LeadStatus) => {
    return getLeadsByStatus(status).reduce((sum, lead) => sum + (lead.value || 0), 0);
  };

  const handleMoveLead = (lead: Lead, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, status: newStatus, updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {leads.length} leads no pipeline
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Board Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            count={getLeadsByStatus(column.status).length}
            totalValue={getTotalValue(column.status)}
          >
            {getLeadsByStatus(column.status).map((lead) => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                onMove={handleMoveLead}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}
