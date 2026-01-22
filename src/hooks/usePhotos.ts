import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Photo, Album, InsertTables, UpdateTables } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

// Albums
export function useAlbums(projectId?: string) {
  return useQuery({
    queryKey: ['albums', projectId],
    queryFn: async () => {
      let query = supabase.from('albums').select('*').order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Album[];
    },
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
      let query = supabase.from('photos').select('*').order('sort_order', { ascending: true });
      
      if (albumId) {
        query = query.eq('album_id', albumId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Photo[];
    },
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
      // Primeiro buscar a foto para pegar a URL
      const { data: photo } = await supabase
        .from('photos')
        .select('url')
        .eq('id', id)
        .single();

      // Deletar do storage se existir
      if (photo?.url) {
        const path = photo.url.split('/project-photos/')[1];
        if (path) {
          await supabase.storage.from('project-photos').remove([path]);
        }
      }

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

// Upload de fotos para o storage
export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      albumId, 
      files 
    }: { 
      albumId: string; 
      files: File[];
    }) => {
      const uploadedPhotos: Photo[] = [];

      for (const file of files) {
        // Gerar nome único para o arquivo
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${albumId}/${fileName}`;

        // Upload para o storage
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          throw uploadError;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);

        // Inserir registro na tabela photos
        const { data: photoData, error: insertError } = await supabase
          .from('photos')
          .insert({
            album_id: albumId,
            url: urlData.publicUrl,
            thumbnail_url: urlData.publicUrl,
            filename: file.name,
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

