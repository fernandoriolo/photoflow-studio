import { CalendarEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

const eventTypeLabels: Record<CalendarEvent['type'], string> = {
  session: 'Sessão',
  meeting: 'Reunião',
  delivery: 'Entrega',
  other: 'Outro',
};

const eventTypeColors: Record<CalendarEvent['type'], string> = {
  session: 'bg-accent text-accent-foreground',
  meeting: 'bg-info text-info-foreground',
  delivery: 'bg-success text-success-foreground',
  other: 'bg-secondary text-secondary-foreground',
};

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Calendar className="h-5 w-5 text-accent" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedEvents.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className="flex gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-col items-center justify-center rounded-lg bg-secondary px-3 py-2 text-center min-w-14">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {format(parseISO(event.date), 'MMM', { locale: ptBR })}
              </span>
              <span className="text-xl font-semibold text-foreground">
                {format(parseISO(event.date), 'dd')}
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-foreground leading-tight">
                  {event.title}
                </h4>
                <Badge className={cn('text-xs shrink-0', eventTypeColors[event.type])}>
                  {eventTypeLabels[event.type]}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-accent">
                  {getDateLabel(event.date)}
                </span>
                
                {event.startTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.startTime}
                    {event.endTime && ` - ${event.endTime}`}
                  </span>
                )}
                
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum evento agendado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
