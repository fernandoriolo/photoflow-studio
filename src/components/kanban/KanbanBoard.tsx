import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useLeads, useUpdateLeadStatus } from '@/hooks/useLeads';
import type { Lead, LeadStatus } from '@/types/database';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const columns: { status: LeadStatus; title: string }[] = [
  { status: 'new', title: 'Novos' },
  { status: 'negotiation', title: 'Em Negociação' },
  { status: 'sent', title: 'Orçamento Enviado' },
  { status: 'closed', title: 'Fechados' },
];

export function KanbanBoard() {
  const { data: leads = [], isLoading, error } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const [activeCard, setActiveCard] = useState<Lead | null>(null);

  // Log de erro para debug
  if (error) console.error('Erro ao carregar leads:', error);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const getTotalValue = (status: LeadStatus) => {
    return getLeadsByStatus(status).reduce((sum, lead) => sum + (lead.value || 0), 0);
  };

  const handleMoveLead = (lead: Lead, newStatus: LeadStatus) => {
    updateStatus.mutate({ id: lead.id, status: newStatus });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) {
      setActiveCard(lead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Opcional: pode ser usado para feedback visual durante o arraste
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Verificar se o over é uma coluna (status)
    const isOverColumn = columns.some((col) => col.status === overId);
    
    if (isOverColumn) {
      const newStatus = overId as LeadStatus;
      const lead = leads.find((l) => l.id === leadId);
      
      if (lead && lead.status !== newStatus) {
        updateStatus.mutate({ id: leadId, status: newStatus });
      }
    } else {
      // Se soltou sobre outro card, pegar o status desse card
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) {
        const lead = leads.find((l) => l.id === leadId);
        if (lead && lead.status !== overLead.status) {
          updateStatus.mutate({ id: leadId, status: overLead.status });
        }
      }
    }
  };

  if (isLoading && !error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
          {columns.map((column) => (
            <div key={column.status} className="w-80 shrink-0">
              <Skeleton className="h-full min-h-[400px] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

      {/* Drag Overlay - mostra o card sendo arrastado */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 opacity-90">
            <KanbanCard lead={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
