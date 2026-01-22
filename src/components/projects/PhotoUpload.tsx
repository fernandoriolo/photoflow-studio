import { useState, useCallback } from 'react';
import { useUploadPhotos, usePhotos, useDeletePhoto } from '@/hooks/usePhotos';
import { useCreateAlbum, useAlbums } from '@/hooks/usePhotos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Trash2, 
  Check,
  Loader2,
  Heart,
  CheckCircle,
  Sparkles,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Photo } from '@/types/database';

interface PhotoUploadProps {
  projectId: string;
  projectTitle: string;
}

export function PhotoUpload({ projectId, projectTitle }: PhotoUploadProps) {
  const { data: albums = [], isLoading: albumsLoading } = useAlbums(projectId);
  const createAlbum = useCreateAlbum();
  const uploadPhotos = useUploadPhotos();
  const deletePhoto = useDeletePhoto();
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Pegar ou criar album principal do projeto
  const getOrCreateAlbum = async () => {
    if (albums.length > 0) {
      return albums[0].id;
    }

    const { id } = await createAlbum.mutateAsync({
      project_id: projectId,
      title: `Fotos - ${projectTitle}`,
      is_proofing: true,
    });

    return id;
  };

  // Pegar o álbum principal
  const mainAlbum = albums[0];
  const { data: photos = [], isLoading: photosLoading } = usePhotos(mainAlbum?.id);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const albumId = await getOrCreateAlbum();
      
      setUploadProgress(5);
      setUploadStatus('Iniciando...');
      
      await uploadPhotos.mutateAsync({
        albumId,
        files: selectedFiles,
        onProgress: (current, total, status) => {
          // Calcular progresso entre 5% e 95%
          const progress = 5 + ((current / total) * 90);
          setUploadProgress(Math.round(progress));
          setUploadStatus(status);
        },
      });

      setUploadProgress(100);
      setUploadStatus('Concluído!');
      toast.success(`${selectedFiles.length} foto(s) enviada(s) com sucesso!`, {
        description: 'Imagens convertidas para WebP com marca d\'água',
      });
      setSelectedFiles([]);
      
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 1500);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar fotos. Tente novamente.');
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync(photoId);
      toast.success('Foto removida!');
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      toast.error('Erro ao remover foto.');
    }
  };

  const isLoading = albumsLoading || photosLoading;
  const isUploading = uploadPhotos.isPending;

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <div
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 p-8 rounded-lg transition-colors cursor-pointer",
              isDragging ? "bg-accent/20" : "bg-muted/30 hover:bg-muted/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('photo-input')?.click()}
          >
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Upload className="h-8 w-8 text-accent" />
            </div>
            
            <div className="text-center">
              <p className="text-lg font-medium">
                Arraste fotos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Formatos aceitos: JPG, PNG, WebP, GIF (máx. 50MB cada)
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Conversão WebP
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Marca d'água
                </Badge>
              </div>
            </div>
          </div>

          {/* Arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </p>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Enviar Fotos
                    </>
                  )}
                </Button>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  {uploadStatus && (
                    <p className="text-sm text-muted-foreground text-center">
                      {uploadStatus}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative aspect-square rounded-md overflow-hidden group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedFile(index);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Galeria de Fotos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Fotos do Projeto ({photos.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={() => handleDeletePhoto(photo.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma foto adicionada</p>
            <p className="text-sm mt-1">Arraste fotos para cá ou clique no botão acima</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de card de foto
function PhotoCard({ 
  photo, 
  onDelete 
}: { 
  photo: Photo; 
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden group">
      <img
        src={photo.url}
        alt={photo.filename}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Overlay com ações */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Indicadores */}
      <div className="absolute top-2 left-2 flex gap-1">
        {photo.is_favorite && (
          <div className="p-1 rounded bg-red-500/80">
            <Heart className="h-3 w-3 text-white fill-white" />
          </div>
        )}
        {photo.is_selected && (
          <div className="p-1 rounded bg-green-500/80">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

