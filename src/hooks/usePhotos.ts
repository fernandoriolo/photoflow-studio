import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Photo, Album, InsertTables, UpdateTables } from '@/types/database';

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

