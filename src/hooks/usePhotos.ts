import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Photo, Album, InsertTables, UpdateTables } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { processImage, type WatermarkOptions } from '@/lib/imageProcessor';

// Albums
export function useAlbums(projectId?: string) {
  return useQuery({
    queryKey: ['albums', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Album[];
    },
    enabled: !!projectId, // Só executa se tiver projectId
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: ['albums', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Album;
    },
    enabled: !!id,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (album: InsertTables<'albums'>) => {
      const { data, error } = await supabase
        .from('albums')
        .insert(album)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

// Photos
export function usePhotos(albumId?: string) {
  return useQuery({
    queryKey: ['photos', albumId],
    queryFn: async () => {
      if (!albumId) return [];
      
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Photo[];
    },
    enabled: !!albumId, // Só executa se tiver albumId
  });
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'photos'> & { id: string }) => {
      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

export function useTogglePhotoSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isSelected }: { id: string; isSelected: boolean }) => {
      const { data, error } = await supabase
        .from('photos')
        .update({ is_selected: isSelected })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

export function useTogglePhotoFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from('photos')
        .update({ is_favorite: isFavorite })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Primeiro buscar a foto para pegar as URLs
      const { data: photo } = await supabase
        .from('photos')
        .select('url, original_url')
        .eq('id', id)
        .single();

      // Deletar ambas versões do storage se existirem
      const pathsToDelete: string[] = [];
      
      if (photo?.url) {
        const watermarkedPath = photo.url.split('/project-photos/')[1];
        if (watermarkedPath) pathsToDelete.push(watermarkedPath);
      }
      
      if (photo?.original_url) {
        const originalPath = photo.original_url.split('/project-photos/')[1];
        if (originalPath) pathsToDelete.push(originalPath);
      }

      if (pathsToDelete.length > 0) {
        await supabase.storage.from('project-photos').remove(pathsToDelete);
      }

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['client-projects-photos'] });
      queryClient.invalidateQueries({ queryKey: ['client-projects-detail'] });
    },
  });
}

// Opções padrão para marca d'água
const defaultWatermarkOptions: WatermarkOptions = {
  text: 'STORYLENS',
  position: 'diagonal',
  opacity: 0.35,
  color: '#ffffff',
};

// Upload de fotos para o storage (com conversão para WebP e marca d'água)
export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      albumId, 
      files,
      watermarkOptions = defaultWatermarkOptions,
      onProgress,
    }: { 
      albumId: string; 
      files: File[];
      watermarkOptions?: WatermarkOptions;
      onProgress?: (current: number, total: number, status: string) => void;
    }) => {
      const uploadedPhotos: Photo[] = [];
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseFileName = uuidv4();
        
        // Status: Processando imagem
        onProgress?.(i, total, `Processando ${file.name}...`);

        // Processar imagem: converter para WebP e adicionar marca d'água
        const processed = await processImage(file, watermarkOptions, 0.85);

        // Status: Enviando
        onProgress?.(i, total, `Enviando ${file.name}...`);

        // Upload da imagem com marca d'água (para visualização do cliente)
        const watermarkedPath = `${albumId}/${baseFileName}_watermarked.webp`;
        const { error: watermarkedError } = await supabase.storage
          .from('project-photos')
          .upload(watermarkedPath, processed.watermarkedBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp',
          });

        if (watermarkedError) {
          console.error('Erro no upload (marca dágua):', watermarkedError);
          throw watermarkedError;
        }

        // Upload da imagem original (sem marca d'água, para download final)
        const originalPath = `${albumId}/${baseFileName}_original.webp`;
        const { error: originalError } = await supabase.storage
          .from('project-photos')
          .upload(originalPath, processed.originalBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp',
          });

        if (originalError) {
          console.error('Erro no upload (original):', originalError);
          throw originalError;
        }

        // Obter URLs públicas
        const { data: watermarkedUrl } = supabase.storage
          .from('project-photos')
          .getPublicUrl(watermarkedPath);

        const { data: originalUrl } = supabase.storage
          .from('project-photos')
          .getPublicUrl(originalPath);

        // Inserir registro na tabela photos
        const { data: photoData, error: insertError } = await supabase
          .from('photos')
          .insert({
            album_id: albumId,
            url: watermarkedUrl.publicUrl,           // URL com marca d'água (exibida)
            thumbnail_url: watermarkedUrl.publicUrl,  // Thumbnail (também com marca)
            original_url: originalUrl.publicUrl,      // URL original (sem marca)
            filename: file.name.replace(/\.[^.]+$/, '.webp'),
            is_selected: false,
            is_favorite: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao inserir foto:', insertError);
          throw insertError;
        }

        uploadedPhotos.push(photoData as Photo);
        onProgress?.(i + 1, total, `${i + 1}/${total} concluído`);
      }

      // Atualizar contagem de fotos no álbum
      const { data: albumPhotos } = await supabase
        .from('photos')
        .select('id')
        .eq('album_id', albumId);

      await supabase
        .from('albums')
        .update({ photo_count: albumPhotos?.length || 0 })
        .eq('id', albumId);

      return uploadedPhotos;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photos', variables.albumId] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['client-projects-photos'] });
      queryClient.invalidateQueries({ queryKey: ['client-projects-detail'] });
    },
  });
}

// Buscar fotos de um projeto (através dos álbuns)
export function useProjectPhotos(projectId: string) {
  return useQuery({
    queryKey: ['project-photos', projectId],
    queryFn: async () => {
      // Primeiro buscar álbuns do projeto
      const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select('id')
        .eq('project_id', projectId);

      if (albumsError) throw albumsError;
      if (!albums || albums.length === 0) return [];

      const albumIds = albums.map(a => a.id);

      // Buscar fotos dos álbuns
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .in('album_id', albumIds)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;
      return photos as Photo[];
    },
    enabled: !!projectId,
  });
}

// Buscar fotos de um cliente (através dos projetos)
export function useClientPhotos(clientId: string) {
  return useQuery({
    queryKey: ['client-photos', clientId],
    queryFn: async () => {
      // Buscar projetos do cliente
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', clientId);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);

      // Buscar álbuns dos projetos
      const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select('id')
        .in('project_id', projectIds);

      if (albumsError) throw albumsError;
      if (!albums || albums.length === 0) return [];

      const albumIds = albums.map(a => a.id);

      // Buscar fotos
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .in('album_id', albumIds)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;
      return photos as Photo[];
    },
    enabled: !!clientId,
  });
}

// Tipo para projeto com fotos
export interface ProjectWithPhotos {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  package_limit: number;
  status: string;
  photos: Photo[];
  selectedCount: number;
  hasSelectionPending: boolean;
}

// Buscar projetos do cliente com suas fotos
export function useClientProjectsWithPhotos(clientId: string) {
  return useQuery({
    queryKey: ['client-projects-photos', clientId],
    queryFn: async () => {
      // Buscar projetos do cliente
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('event_date', { ascending: false });

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const result: ProjectWithPhotos[] = [];

      for (const project of projects) {
        // Buscar álbuns do projeto
        const { data: albums } = await supabase
          .from('albums')
          .select('id')
          .eq('project_id', project.id);

        if (!albums || albums.length === 0) {
          result.push({
            id: project.id,
            title: project.title,
            event_type: project.event_type,
            event_date: project.event_date,
            package_limit: project.package_limit,
            status: project.status,
            photos: [],
            selectedCount: 0,
            hasSelectionPending: false,
          });
          continue;
        }

        const albumIds = albums.map(a => a.id);

        // Buscar fotos dos álbuns
        const { data: photos } = await supabase
          .from('photos')
          .select('*')
          .in('album_id', albumIds)
          .order('created_at', { ascending: true });

        const projectPhotos = (photos || []) as Photo[];
        const selectedCount = projectPhotos.filter(p => p.is_selected).length;
        
        // Tem seleção pendente se selecionou fotos e status não é 'delivered'
        const hasSelectionPending = selectedCount > 0 && project.status !== 'delivered';

        result.push({
          id: project.id,
          title: project.title,
          event_type: project.event_type,
          event_date: project.event_date,
          package_limit: project.package_limit,
          status: project.status,
          photos: projectPhotos,
          selectedCount,
          hasSelectionPending,
        });
      }

      return result;
    },
    enabled: !!clientId,
  });
}

// Verificar se cliente tem seleção pendente
export function useClientHasPendingSelection(clientId: string) {
  return useQuery({
    queryKey: ['client-pending-selection', clientId],
    queryFn: async () => {
      // Buscar projetos do cliente que não estão entregues
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', clientId)
        .neq('status', 'delivered');

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return false;

      const projectIds = projects.map(p => p.id);

      // Buscar álbuns
      const { data: albums } = await supabase
        .from('albums')
        .select('id')
        .in('project_id', projectIds);

      if (!albums || albums.length === 0) return false;

      const albumIds = albums.map(a => a.id);

      // Verificar se tem fotos selecionadas
      const { count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .in('album_id', albumIds)
        .eq('is_selected', true);

      return (count || 0) > 0;
    },
    enabled: !!clientId,
  });
}

// Adicionar comentário em uma foto
export function useAddPhotoComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const { data, error } = await supabase
        .from('photos')
        .update({ comment })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['client-projects-photos'] });
    },
  });
}

