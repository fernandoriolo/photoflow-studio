import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientProjectsWithPhotos, useTogglePhotoSelection, useAddPhotoComment } from '@/hooks/usePhotos';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check, 
  LogOut,
  Image as ImageIcon,
  Loader2,
  X,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Camera,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Photo } from '@/types/database';
import type { ProjectWithPhotos } from '@/hooks/usePhotos';

export default function ClienteGaleria() {
  const { user, signOut, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState<ProjectWithPhotos | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ photo: Photo; index: number } | null>(null);
  const [comment, setComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  
  // Buscar o cliente vinculado ao usuário auth
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client-by-auth', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar cliente:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: projects = [], isLoading: projectsLoading, refetch } = useClientProjectsWithPhotos(client?.id || '');
  const toggleSelection = useTogglePhotoSelection();
  const addComment = useAddPhotoComment();

  // Calcular valores extras
  const calculateExtraPhotos = (project: ProjectWithPhotos) => {
    const extra = project.selectedCount - project.package_limit;
    return extra > 0 ? extra : 0;
  };

  const PRICE_PER_EXTRA_PHOTO = 50; // Preço por foto extra

  // Manipuladores
  const handleToggleSelection = async (photo: Photo, project: ProjectWithPhotos) => {
    const isSelecting = !photo.is_selected;
    
    // Atualização otimista - atualiza imediatamente a UI
    const updatedPhoto = { ...photo, is_selected: isSelecting };
    
    // Atualizar o estado local do viewingPhoto imediatamente
    if (viewingPhoto && viewingPhoto.photo.id === photo.id) {
      setViewingPhoto({ ...viewingPhoto, photo: updatedPhoto });
    }
    
    // Atualizar o estado local do selectedProject imediatamente
    if (selectedProject) {
      const updatedPhotos = selectedProject.photos.map(p => 
        p.id === photo.id ? updatedPhoto : p
      );
      const newSelectedCount = updatedPhotos.filter(p => p.is_selected).length;
      setSelectedProject({
        ...selectedProject,
        photos: updatedPhotos,
        selectedCount: newSelectedCount,
        hasSelectionPending: newSelectedCount > 0 && selectedProject.status !== 'delivered',
      });
    }
    
    // Mostrar feedback imediato
    if (isSelecting) {
      const newCount = project.selectedCount + 1;
      if (newCount > project.package_limit) {
        toast.info(`Foto extra! Você selecionou ${newCount - project.package_limit} foto(s) além do limite.`, {
          description: `Custo adicional: R$ ${(newCount - project.package_limit) * PRICE_PER_EXTRA_PHOTO},00`,
        });
      } else {
        toast.success('Foto selecionada!');
      }
    } else {
      toast.success('Foto desmarcada');
    }
    
    try {
      // Salvar no servidor em background
      await toggleSelection.mutateAsync({
        id: photo.id,
        isSelected: isSelecting,
      });
      
      // Sincronizar com o servidor
      queryClient.invalidateQueries({ queryKey: ['client-projects-photos'] });
    } catch (error) {
      // Reverter em caso de erro
      toast.error('Erro ao selecionar foto. Tente novamente.');
      
      // Reverter o estado local
      if (viewingPhoto && viewingPhoto.photo.id === photo.id) {
        setViewingPhoto({ ...viewingPhoto, photo });
      }
      if (selectedProject) {
        const revertedPhotos = selectedProject.photos.map(p => 
          p.id === photo.id ? photo : p
        );
        const revertedCount = revertedPhotos.filter(p => p.is_selected).length;
        setSelectedProject({
          ...selectedProject,
          photos: revertedPhotos,
          selectedCount: revertedCount,
        });
      }
    }
  };

  const handleSaveComment = async () => {
    if (!viewingPhoto) return;
    
    setIsSavingComment(true);
    try {
      await addComment.mutateAsync({
        id: viewingPhoto.photo.id,
        comment: comment.trim(),
      });
      toast.success('Comentário salvo!');
      queryClient.invalidateQueries({ queryKey: ['client-projects-photos'] });
    } catch (error) {
      toast.error('Erro ao salvar comentário');
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleOpenPhoto = (photo: Photo, index: number) => {
    setViewingPhoto({ photo, index });
    setComment(photo.comment || '');
  };

  const handleClosePhoto = () => {
    setViewingPhoto(null);
    setComment('');
  };

  const handleNavigatePhoto = (direction: 'prev' | 'next') => {
    if (!viewingPhoto || !selectedProject) return;
    
    const currentIndex = viewingPhoto.index;
    const photos = selectedProject.photos;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newPhoto = photos[newIndex];
    setViewingPhoto({ photo: newPhoto, index: newIndex });
    setComment(newPhoto.comment || '');
  };

  const isLoading = clientLoading || projectsLoading;

  // Estatísticas totais
  const totalPhotos = useMemo(() => 
    projects.reduce((sum, p) => sum + p.photos.length, 0), 
    [projects]
  );
  
  const totalSelected = useMemo(() => 
    projects.reduce((sum, p) => sum + p.selectedCount, 0), 
    [projects]
  );

  if (!client && !clientLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Acesso não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Sua conta não está vinculada a nenhum cliente. Entre em contato com o fotógrafo.
            </p>
            <Button onClick={signOut} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedProject && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProject(null)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">
                {selectedProject ? selectedProject.title : 'Minhas Fotos'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedProject 
                  ? `${selectedProject.selectedCount}/${selectedProject.package_limit} fotos selecionadas`
                  : `Olá, ${profile?.name || client?.name || 'Cliente'}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!selectedProject && (
              <div className="text-right text-sm hidden sm:block">
                <p className="font-medium">{totalSelected} selecionadas</p>
                <p className="text-muted-foreground">{totalPhotos} fotos disponíveis</p>
              </div>
            )}
            <Button onClick={signOut} variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : selectedProject ? (
          // Visualização do projeto selecionado
          <div className="space-y-6">
            {/* Info do projeto */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Camera className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{selectedProject.photos.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Check className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">{selectedProject.selectedCount}</p>
                  <p className="text-xs text-muted-foreground">Selecionadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ImageIcon className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">{selectedProject.package_limit}</p>
                  <p className="text-xs text-muted-foreground">Limite do Pacote</p>
                </CardContent>
              </Card>
              <Card className={cn(
                calculateExtraPhotos(selectedProject) > 0 && "border-orange-500 bg-orange-500/5"
              )}>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-500">
                    {calculateExtraPhotos(selectedProject) > 0 
                      ? `R$ ${calculateExtraPhotos(selectedProject) * PRICE_PER_EXTRA_PHOTO}`
                      : 'R$ 0'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {calculateExtraPhotos(selectedProject)} foto(s) extra
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Aviso de fotos extras */}
            {calculateExtraPhotos(selectedProject) > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Você selecionou fotos além do pacote</p>
                  <p className="text-sm opacity-80">
                    {calculateExtraPhotos(selectedProject)} foto(s) extra × R$ {PRICE_PER_EXTRA_PHOTO},00 = 
                    <strong> R$ {calculateExtraPhotos(selectedProject) * PRICE_PER_EXTRA_PHOTO},00</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Galeria */}
            {selectedProject.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedProject.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer group",
                      "ring-2 transition-all",
                      photo.is_selected 
                        ? "ring-green-500 ring-offset-2 ring-offset-background" 
                        : "ring-transparent hover:ring-muted-foreground/30"
                    )}
                    onClick={() => handleOpenPhoto(photo, index)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Visualizar</span>
                    </div>

                    {/* Indicador de selecionada */}
                    {photo.is_selected && (
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-green-500 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    )}

                    {/* Indicador de comentário */}
                    {photo.comment && (
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-blue-500 text-white">
                        <MessageSquare className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Nenhuma foto neste projeto</h3>
                <p className="text-muted-foreground mt-1">
                  Aguarde o fotógrafo adicionar suas fotos
                </p>
              </div>
            )}
          </div>
        ) : (
          // Lista de projetos
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Seus Projetos</h2>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      project.hasSelectionPending && "ring-2 ring-green-500 animate-pulse"
                    )}
                    onClick={() => setSelectedProject(project)}
                  >
                    {/* Capa do projeto */}
                    <div className="relative h-40 bg-muted">
                      {project.photos.length > 0 ? (
                        <img
                          src={project.photos[0].url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Badge de fotos extras */}
                      {calculateExtraPhotos(project) > 0 && (
                        <Badge className="absolute top-2 right-2 bg-orange-500">
                          +{calculateExtraPhotos(project)} extra
                        </Badge>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(project.event_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-green-500">{project.selectedCount}</span>
                          <span className="text-muted-foreground">/{project.package_limit} selecionadas</span>
                        </div>
                        <Badge variant="secondary">
                          {project.photos.length} fotos
                        </Badge>
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Nenhum projeto disponível</h3>
                <p className="text-muted-foreground mt-1">
                  Aguarde o fotógrafo criar seus projetos
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de visualização em tela cheia */}
      {viewingPhoto && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
          {/* Header do modal - altura fixa */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
            <div className="text-white flex items-center gap-4">
              <p className="font-medium">{viewingPhoto.index + 1} / {selectedProject.photos.length}</p>
              {viewingPhoto.photo.is_selected && (
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <Check className="h-4 w-4" />
                  Selecionada
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleClosePhoto}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Container da imagem - ocupa espaço restante com limite */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
            {/* Navegação anterior */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 z-10"
              onClick={() => handleNavigatePhoto('prev')}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            {/* Imagem com altura máxima calculada */}
            <img
              src={viewingPhoto.photo.url}
              alt={viewingPhoto.photo.filename}
              className="max-w-[calc(100%-120px)] max-h-full object-contain"
            />

            {/* Navegação próxima */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 z-10"
              onClick={() => handleNavigatePhoto('next')}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Footer com ações e comentário - altura fixa, sempre visível */}
          <div className="flex-shrink-0 p-4 bg-black/90 border-t border-white/10">
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              {/* Botão de seleção */}
              <Button
                size="lg"
                variant={viewingPhoto.photo.is_selected ? "default" : "outline"}
                className={cn(
                  "gap-2 flex-shrink-0",
                  viewingPhoto.photo.is_selected 
                    ? "bg-green-500 hover:bg-green-600 text-white" 
                    : "text-white border-white/50 hover:bg-white/10"
                )}
                onClick={() => handleToggleSelection(viewingPhoto.photo, selectedProject)}
              >
                <Check className="h-5 w-5" />
                {viewingPhoto.photo.is_selected ? 'Selecionada' : 'Selecionar'}
              </Button>

              {/* Campo de comentário */}
              <div className="flex-1 space-y-1">
                <label className="text-xs text-white/60">Comentário (opcional)</label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none text-sm min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    onClick={handleSaveComment}
                    disabled={isSavingComment || comment === (viewingPhoto.photo.comment || '')}
                    size="sm"
                    className="self-end"
                  >
                    {isSavingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
