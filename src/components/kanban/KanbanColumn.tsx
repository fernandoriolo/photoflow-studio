import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/database';

interface KanbanColumnProps {
  status: LeadStatus;
  title: string;
  count: number;
  totalValue: number;
  children: ReactNode;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-pipeline-new',
  negotiation: 'bg-pipeline-negotiation',
  sent: 'bg-pipeline-sent',
  closed: 'bg-pipeline-closed',
};

export function KanbanColumn({ status, title, count, totalValue, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-80 flex-shrink-0 flex-col rounded-xl bg-muted/30 transition-colors duration-200',
        isOver && 'bg-accent/10 ring-2 ring-accent/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-3 w-3 rounded-full', statusColors[status])} />
          <h3 className="font-medium text-foreground">{title}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-medium text-secondary-foreground">
            {count}
          </span>
        </div>
      </div>

      {/* Total Value */}
      <div className="px-4 pb-3">
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
        {children}
      </div>
    </div>
  );
}
