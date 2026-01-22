import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import type { EventType } from '@/types/database';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const eventTypeLabels: Record<EventType, string> = {
  session: 'Sessão',
  meeting: 'Reunião',
  delivery: 'Entrega',
  other: 'Outro',
};

const eventTypeColors: Record<EventType, string> = {
  session: 'bg-accent text-accent-foreground',
  meeting: 'bg-info text-info-foreground',
  delivery: 'bg-success text-success-foreground',
  other: 'bg-secondary text-secondary-foreground',
};

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: calendarEvents = [], isLoading } = useCalendarEvents();

  const eventsOnDate = selectedDate
    ? calendarEvents.filter((event) =>
        isSameDay(parseISO(event.date), selectedDate)
      )
    : [];

  const datesWithEvents = calendarEvents.map((event) => parseISO(event.date));

  if (isLoading) {
    return (
      <DashboardLayout
        title="Agenda"
        subtitle="Visualize seus compromissos e sessões"
      >
        <div className="grid gap-6 p-6 lg:grid-cols-[400px_1fr]">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Agenda"
      subtitle="Visualize seus compromissos e sessões"
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[400px_1fr]">
        {/* Calendar */}
        <Card className="border-0 shadow-soft h-fit">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display">Calendário</CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Evento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-lg"
              modifiers={{
                hasEvent: datesWithEvents,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(var(--accent))',
                  textUnderlineOffset: '4px',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-display">
              {selectedDate
                ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })
                : 'Selecione uma data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsOnDate.length > 0 ? (
              <div className="space-y-4">
                {eventsOnDate.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-soft"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                      <span className="text-lg font-semibold text-foreground">
                        {event.start_time?.split(':')[0] || '—'}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-foreground">
                          {event.title}
                        </h4>
                        <Badge className={cn('shrink-0', eventTypeColors[event.type as EventType])}>
                          {eventTypeLabels[event.type as EventType]}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {event.start_time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {event.start_time}
                            {event.end_time && ` - ${event.end_time}`}
                          </span>
                        )}

                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.notes && (
                        <p className="text-sm text-muted-foreground">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <h3 className="font-medium text-foreground">
                  Nenhum evento nesta data
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clique em "Novo Evento" para adicionar um compromisso
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
