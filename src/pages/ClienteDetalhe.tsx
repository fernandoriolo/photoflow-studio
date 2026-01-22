import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClient } from '@/hooks/useClients';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useUploadPhotos, 
  usePhotos, 
  useDeletePhoto,
  useCreateAlbum,
  useAlbums,
} from '@/hooks/usePhotos';
import { useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { PhotoUpload } from '@/components/projects/PhotoUpload';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Camera,
  MapPin,
  DollarSign,
  FolderOpen,
  Plus,
  Settings,
  Trash2,
  Check,
  MessageSquare,
  AlertCircle,
  Edit,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Project, Photo, Client } from '@/types/database';

const projectStatusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em Andamento',
  editing: 'Edição',
  delivered: 'Entregue',
};

const projectStatusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-500',
  in_progress: 'bg-yellow-500/10 text-yellow-500',
  editing: 'bg-purple-500/10 text-purple-500',
  delivered: 'bg-green-500/10 text-green-500',
};

interface ProjectWithPhotos extends Project {
  photos: Photo[];
  selectedCount: number;
  extraPhotos: number;
  extraValue: number;
}

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState<ProjectWithPhotos | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  const { data: client, isLoading: clientLoading } = useClient(id || '');
  
  // Buscar projetos com fotos
  const { data: projectsWithPhotos = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['client-projects-detail', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', id)
        .order('event_date', { ascending: false });

      if (projectsError) throw projectsError;
      if (!projects) return [];

      const result: ProjectWithPhotos[] = [];

      for (const project of projects) {
        const { data: albums } = await supabase
          .from('albums')
          .select('id')
          .eq('project_id', project.id);

        let photos: Photo[] = [];
        let selectedCount = 0;

        if (albums && albums.length > 0) {
          const albumIds = albums.map(a => a.id);
          const { data: photosData } = await supabase
            .from('photos')
            .select('*')
            .in('album_id', albumIds)
            .order('created_at', { ascending: true });

          photos = (photosData || []) as Photo[];
          selectedCount = photos.filter(p => p.is_selected).length;
        }

        const pricePerPhoto = project.price_per_extra_photo || 50;
        const extraPhotos = Math.max(0, selectedCount - project.package_limit);
        const extraValue = extraPhotos * pricePerPhoto;

        result.push({
          ...project,
          photos,
          selectedCount,
          extraPhotos,
          extraValue,
        });
      }

      return result;
    },
    enabled: !!id,
  });

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // Estatísticas
  const totalProjects = projectsWithPhotos.length;
  const totalPhotos = projectsWithPhotos.reduce((sum, p) => sum + p.photos.length, 0);
  const totalSelected = projectsWithPhotos.reduce((sum, p) => sum + p.selectedCount, 0);
  const totalExtraValue = projectsWithPhotos.reduce((sum, p) => sum + p.extraValue, 0);
  const pendingSelections = projectsWithPhotos.filter(p => p.selectedCount > 0 && p.status !== 'delivered').length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateProjectStatus = async (project: Project, newStatus: string) => {
    try {
      await updateProject.mutateAsync({ id: project.id, status: newStatus });
      toast.success('Status atualizado!');
      
      // Atualizar o selectedProject localmente para refletir a mudança
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      refetchProjects();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUpdateProjectPrice = async (project: Project, newPrice: number) => {
    try {
      await updateProject.mutateAsync({ id: project.id, price_per_extra_photo: newPrice });
      toast.success('Preço atualizado!');
      
      // Atualizar o selectedProject localmente
      if (selectedProject && selectedProject.id === project.id) {
        const extraPhotos = Math.max(0, selectedProject.selectedCount - selectedProject.package_limit);
        const extraValue = extraPhotos * newPrice;
        setSelectedProject(prev => prev ? { 
          ...prev, 
          price_per_extra_photo: newPrice,
          extraValue: extraValue
        } : null);
      }
      
      refetchProjects();
    } catch (error) {
      toast.error('Erro ao atualizar preço');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject.mutateAsync(projectToDelete.id);
      toast.success('Projeto excluído!');
      setIsDeleteAlertOpen(false);
      setProjectToDelete(null);
      refetchProjects();
    } catch (error) {
      toast.error('Erro ao excluir projeto');
    }
  };

  const isLoading = clientLoading || projectsLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Carregando..." subtitle="">
        <div className="p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout title="Cliente não encontrado" subtitle="">
        <div className="p-6 flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">O cliente solicitado não foi encontrado.</p>
          <Button onClick={() => navigate('/clientes')}>Voltar para Clientes</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={client.name} 
      subtitle="Gestão completa do cliente"
    >
      <div className="p-6 space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={client.avatar_url || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </span>
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {pendingSelections > 0 && (
            <Badge className="bg-green-500 text-white animate-pulse">
              <AlertCircle className="h-4 w-4 mr-1" />
              {pendingSelections} projeto(s) com seleção pendente
            </Badge>
          )}
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProjects}</p>
                  <p className="text-xs text-muted-foreground">Projetos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Camera className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPhotos}</p>
                  <p className="text-xs text-muted-foreground">Fotos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSelected}</p>
                  <p className="text-xs text-muted-foreground">Selecionadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(totalExtraValue > 0 && "border-orange-500")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    R$ {totalExtraValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Valor Extra</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de projetos ou detalhes do projeto selecionado */}
        {selectedProject ? (
          // Visualização detalhada do projeto
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedProject.event_type} • {format(new Date(selectedProject.event_date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
              <Badge className={projectStatusColors[selectedProject.status]}>
                {projectStatusLabels[selectedProject.status]}
              </Badge>
            </div>

            {/* Configurações do projeto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={selectedProject.status}
                      onValueChange={(value) => handleUpdateProjectStatus(selectedProject, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="editing">Edição</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Limite de Fotos</Label>
                    <p className="text-lg font-semibold mt-1">{selectedProject.package_limit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Preço por Foto Extra</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        className="w-24"
                        defaultValue={selectedProject.price_per_extra_photo || 50}
                        onBlur={(e) => handleUpdateProjectPrice(selectedProject, Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Extra Total</Label>
                    <p className={cn(
                      "text-lg font-semibold mt-1",
                      selectedProject.extraValue > 0 && "text-orange-500"
                    )}>
                      R$ {selectedProject.extraValue.toFixed(2)}
                      {selectedProject.extraPhotos > 0 && (
                        <span className="text-xs font-normal ml-1">
                          ({selectedProject.extraPhotos} fotos)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo de seleção */}
            {selectedProject.selectedCount > 0 && (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">
                          Cliente selecionou {selectedProject.selectedCount} foto(s)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Limite: {selectedProject.package_limit} • 
                          Extra: {selectedProject.extraPhotos} foto(s)
                        </p>
                      </div>
                    </div>
                    {selectedProject.status !== 'delivered' && (
                      <Button 
                        size="sm"
                        onClick={() => handleUpdateProjectStatus(selectedProject, 'delivered')}
                      >
                        Marcar como Entregue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload e galeria de fotos */}
            <PhotoUpload
              projectId={selectedProject.id}
              projectTitle={selectedProject.title}
            />

            {/* Fotos com comentários do cliente */}
            {selectedProject.photos.filter(p => p.comment).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentários do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedProject.photos
                      .filter(p => p.comment)
                      .map((photo) => (
                        <div key={photo.id} className="flex gap-4 p-3 rounded-lg bg-muted/50">
                          <img
                            src={photo.url}
                            alt={photo.filename}
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                            onClick={() => setViewingPhoto(photo)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {photo.is_selected && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  Selecionada
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{photo.comment}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Lista de projetos
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Projetos</h2>
              <Button className="gap-2" onClick={() => setIsNewProjectModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </div>

            {projectsWithPhotos.length > 0 ? (
              <div className="grid gap-4">
                {projectsWithPhotos.map((project) => (
                  <Card 
                    key={project.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      project.selectedCount > 0 && project.status !== 'delivered' && 
                        "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {project.photos.length > 0 ? (
                            <img
                              src={project.photos[0].url}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold truncate">{project.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {project.event_type}
                              </p>
                            </div>
                            <Badge className={projectStatusColors[project.status]}>
                              {projectStatusLabels[project.status]}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(project.event_date), "dd/MM/yyyy")}
                            </span>
                            {project.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {project.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{project.photos.length} fotos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {project.selectedCount}/{project.package_limit} selecionadas
                              </span>
                            </div>
                            {project.extraValue > 0 && (
                              <Badge variant="outline" className="border-orange-500 text-orange-500">
                                +R$ {project.extraValue.toFixed(2)}
                              </Badge>
                            )}
                          </div>

                          {/* Barra de progresso */}
                          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all rounded-full",
                                project.selectedCount > project.package_limit 
                                  ? "bg-orange-500" 
                                  : "bg-green-500"
                              )}
                              style={{ 
                                width: `${Math.min(100, (project.selectedCount / project.package_limit) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-1">Nenhum projeto</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie o primeiro projeto para este cliente
                  </p>
                  <Button onClick={() => setIsNewProjectModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal de novo projeto */}
      {client && (
        <NewProjectModal
          open={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          client={client}
          onSuccess={() => refetchProjects()}
        />
      )}

      {/* Modal de visualização de foto */}
      {viewingPhoto && (
        <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Foto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={viewingPhoto.url}
                alt={viewingPhoto.filename}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
              {viewingPhoto.comment && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-1">Comentário do cliente:</p>
                  <p>{viewingPhoto.comment}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Alert de exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as fotos e dados do projeto serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

