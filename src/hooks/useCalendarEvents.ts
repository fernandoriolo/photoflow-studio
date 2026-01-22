import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent, InsertTables, UpdateTables } from '@/types/database';

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: ['calendar_events', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as CalendarEvent;
    },
    enabled: !!id,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: InsertTables<'calendar_events'>) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'calendar_events'> & { id: string }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
    },
  });
}

