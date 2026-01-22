import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client, Project, CalendarEvent } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Mail,
  Phone,
  Calendar,
  Camera,
  MapPin,
  Clock,
  DollarSign,
  Plus,
} from 'lucide-react';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NewProjectModal } from '@/components/projects/NewProjectModal';

interface ClientProfileModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}

const projectStatusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em Andamento',
  editing: 'Edição',
  delivered: 'Entregue',
};

const projectStatusColors: Record<string, string> = {
  scheduled: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning',
  editing: 'bg-accent/10 text-accent',
  delivered: 'bg-success/10 text-success',
};

export function ClientProfileModal({ client, open, onClose }: ClientProfileModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    if (client && open) {
      fetchClientData();
    } else if (!open) {
      // Reset state when modal closes
      setProjects([]);
      setEvents([]);
      setIsLoading(false);
      setError(null);
    }
  }, [client, open]);

  const fetchClientData = async () => {
    if (!client) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar projetos do cliente
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', client.id)
        .order('event_date', { ascending: false });
      
      if (projectsError) {
        console.error('Erro ao buscar projetos:', projectsError);
        setError('Erro ao carregar projetos');
      }
      
      setProjects(projectsData || []);

      // Buscar eventos relacionados aos projetos do cliente
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .in('project_id', projectIds)
          .order('date', { ascending: true });
        
        if (eventsError) {
          console.error('Erro ao buscar eventos:', eventsError);
        }
        
        setEvents(eventsData || []);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do cliente:', err);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

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

  const upcomingEvents = events.filter(e => isFuture(parseISO(e.date)));
  const pastEvents = events.filter(e => isPast(parseISO(e.date)));
  
  const totalValue = projects.reduce((sum, p) => {
    // Calcular valor baseado no package_limit (exemplo: R$50 por foto)
    return sum + (p.package_limit * 50);
  }, 0);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil do Cliente</DialogTitle>
          <DialogDescription className="sr-only">
            Informações detalhadas do cliente, projetos e eventos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Cliente - sempre visível */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={client.avatar_url || undefined} />
              <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Cliente desde</p>
              <p className="font-medium">
                {client.created_at && format(new Date(client.created_at), "MMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
              <Skeleton className="h-48" />
            </div>
          ) : !error && (
            <>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4 text-center">
                  <Camera className="h-5 w-5 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-semibold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Projetos</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-semibold">{upcomingEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Próximos Eventos</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="projects">Projetos</TabsTrigger>
                <TabsTrigger value="events">Agenda</TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="mt-4">
                <div className="flex justify-end mb-3">
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setIsNewProjectModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Novo Projeto
                  </Button>
                </div>
                {projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <Card key={project.id} className="border shadow-soft">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {project.event_type}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(project.event_date), "dd/MM/yyyy")}
                                </span>
                                {project.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {project.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={cn(projectStatusColors[project.status])}>
                              {projectStatusLabels[project.status]}
                            </Badge>
                          </div>
                          {project.total_photos && (
                            <div className="mt-3 pt-3 border-t text-sm">
                              <span className="text-muted-foreground">Fotos: </span>
                              <span className="font-medium">
                                {project.selected_photos || 0} / {project.total_photos} selecionadas
                              </span>
                              <span className="text-muted-foreground"> (limite: {project.package_limit})</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Camera className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum projeto registrado</p>
                    <p className="text-sm mt-1">Clique no botão acima para criar o primeiro projeto</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="events" className="mt-4">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Próximos Eventos</h4>
                    {upcomingEvents.map((event) => (
                      <Card key={event.id} className="border shadow-soft">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                              <Calendar className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{event.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>
                                  {format(parseISO(event.date), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                                {event.start_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.start_time}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum evento agendado</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      </DialogContent>

      {/* Modal de Novo Projeto */}
      {client && (
        <NewProjectModal
          open={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          client={client}
          onSuccess={fetchClientData}
        />
      )}
    </Dialog>
  );
}

