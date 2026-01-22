import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { sampleGalleryPhotos } from '@/data/mockData';
import { Photo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Heart,
  Check,
  MessageCircle,
  Download,
  Grid3X3,
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Galerias() {
  const [photos, setPhotos] = useState<Photo[]>(sampleGalleryPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');

  const packageLimit = 8;
  const selectedCount = photos.filter((p) => p.isSelected).length;
  const extraPhotos = Math.max(0, selectedCount - packageLimit);

  const toggleSelect = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, isSelected: !p.isSelected } : p
      )
    );
  };

  const toggleFavorite = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setShowCommentInput(false);
    setComment('');
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex =
      direction === 'prev'
        ? (currentIndex - 1 + photos.length) % photos.length
        : (currentIndex + 1) % photos.length;
    setSelectedPhoto(photos[newIndex]);
  };

  return (
    <DashboardLayout
      title="Galerias"
      subtitle="Gerencie seus álbuns e entregas"
    >
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Ensaio Bruno & Carla
            </h2>
            <p className="text-muted-foreground">
              Selecione suas fotos favoritas para o álbum final
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Álbum
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <Card className="border-0 shadow-soft">
          <CardContent className="flex flex-wrap items-center gap-6 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total de fotos:</span>
              <Badge variant="secondary" className="text-sm">
                {photos.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Selecionadas:</span>
              <Badge
                className={cn(
                  'text-sm',
                  selectedCount > packageLimit
                    ? 'bg-warning text-warning-foreground'
                    : 'bg-success text-success-foreground'
                )}
              >
                {selectedCount} / {packageLimit}
              </Badge>
            </div>
            {extraPhotos > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-warning font-medium">
                  +{extraPhotos} fotos extras (R$ {extraPhotos * 25},00)
                </span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('masonry')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photo Grid */}
        <div
          className={cn(
            'grid gap-4',
            viewMode === 'grid'
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          )}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={cn(
                'group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted cursor-pointer transition-all',
                photo.isSelected && 'ring-2 ring-accent ring-offset-2'
              )}
              onClick={() => openLightbox(photo)}
            >
              <img
                src={photo.thumbnailUrl}
                alt={photo.filename}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Selection Badge */}
              {photo.isSelected && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                  <Check className="h-4 w-4 text-accent-foreground" />
                </div>
              )}

              {/* Favorite Badge */}
              {photo.isFavorite && (
                <div className="absolute left-2 top-2">
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </div>
              )}

              {/* Actions */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1.5 bg-white/90 text-foreground hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(photo.id);
                  }}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4',
                      photo.isFavorite && 'fill-red-500 text-red-500'
                    )}
                  />
                  Amei
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    'h-8 gap-1.5',
                    photo.isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-white/90 text-foreground hover:bg-white'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(photo.id);
                  }}
                >
                  <Check className="h-4 w-4" />
                  {photo.isSelected ? 'Selecionada' : 'Selecionar'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        <Dialog open={!!selectedPhoto} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-5xl p-0 bg-black border-0">
            <div className="relative">
              {/* Navigation */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigatePhoto('prev')}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigatePhoto('next')}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Image */}
              {selectedPhoto && (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.filename}
                  className="max-h-[70vh] w-full object-contain"
                />
              )}

              {/* Bottom Actions */}
              {selectedPhoto && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => toggleFavorite(selectedPhoto.id)}
                      >
                        <Heart
                          className={cn(
                            'h-4 w-4',
                            selectedPhoto.isFavorite && 'fill-red-500 text-red-500'
                          )}
                        />
                        Amei
                      </Button>
                      <Button
                        className={cn(
                          'gap-2',
                          selectedPhoto.isSelected && 'bg-accent'
                        )}
                        onClick={() => toggleSelect(selectedPhoto.id)}
                      >
                        <Check className="h-4 w-4" />
                        {selectedPhoto.isSelected ? 'Selecionada' : 'Selecionar'}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowCommentInput(!showCommentInput)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Comentar
                      </Button>
                    </div>
                    <span className="text-sm text-white/60">
                      {photos.findIndex((p) => p.id === selectedPhoto.id) + 1} /{' '}
                      {photos.length}
                    </span>
                  </div>

                  {showCommentInput && (
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        placeholder="Deixe um comentário sobre esta foto..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        rows={2}
                      />
                      <Button className="shrink-0">Enviar</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
