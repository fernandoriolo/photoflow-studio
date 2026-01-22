import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Lead, LeadStatus } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, MoreHorizontal, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  lead: Lead;
  onEdit?: (lead: Lead) => void;
  onMove?: (lead: Lead, newStatus: LeadStatus) => void;
}

export function KanbanCard({ lead, onEdit, onMove }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM, yyyy", { locale: ptBR });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-grab border-0 bg-card shadow-soft transition-all hover:shadow-medium',
        isDragging && 'opacity-50 shadow-elevated cursor-grabbing z-50',
        !isDragging && 'hover:-translate-y-0.5'
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-secondary text-sm font-medium text-secondary-foreground">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-foreground leading-tight">{lead.name}</h4>
              <p className="text-xs text-muted-foreground">{lead.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit?.(lead)}>
                  Editar lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove?.(lead, 'new')}>
                  Mover para Novos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove?.(lead, 'negotiation')}>
                  Mover para Negociação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove?.(lead, 'sent')}>
                  Mover para Enviado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove?.(lead, 'closed')}>
                  Marcar como Fechado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Event Type Badge */}
        <Badge variant="secondary" className="mb-3 text-xs font-normal">
          {lead.event_type}
        </Badge>

        {/* Details */}
        <div className="space-y-2">
          {lead.event_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(lead.event_date)}</span>
            </div>
          )}
          
          {lead.value && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {formatCurrency(lead.value)}
              </span>
            </div>
          )}
        </div>

        {/* Notes Preview */}
        {lead.notes && (
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground border-t border-border pt-3">
            {lead.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
