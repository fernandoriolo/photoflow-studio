import type { Lead, LeadStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface RecentLeadsProps {
  leads: Lead[];
}

const statusLabels: Record<LeadStatus, string> = {
  new: 'Novo',
  negotiation: 'Negociação',
  sent: 'Enviado',
  closed: 'Fechado',
};

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-pipeline-new/10 text-pipeline-new border-pipeline-new/20',
  negotiation: 'bg-pipeline-negotiation/10 text-pipeline-negotiation border-pipeline-negotiation/20',
  sent: 'bg-pipeline-sent/10 text-pipeline-sent border-pipeline-sent/20',
  closed: 'bg-pipeline-closed/10 text-pipeline-closed border-pipeline-closed/20',
};

export function RecentLeads({ leads }: RecentLeadsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedLeads = [...leads].sort(
    (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Users className="h-5 w-5 text-accent" />
          Leads Recentes
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-sm">
          <Link to="/pipeline">
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedLeads.slice(0, 5).map((lead) => (
          <div
            key={lead.id}
            className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-secondary text-sm font-medium text-secondary-foreground">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground truncate">
                  {lead.name}
                </h4>
                <Badge
                  variant="outline"
                  className={cn('text-xs shrink-0 border', statusColors[lead.status as LeadStatus])}
                >
                  {statusLabels[lead.status as LeadStatus]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {lead.event_type}
              </p>
            </div>

            <div className="text-right shrink-0">
              {lead.value && (
                <p className="font-semibold text-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(lead.value)}
                </p>
              )}
              {lead.created_at && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>
        ))}

        {leads.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum lead cadastrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
