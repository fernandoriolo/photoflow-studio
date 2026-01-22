import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Quote, QuoteItem, InsertTables, UpdateTables } from '@/types/database';

export type QuoteWithItems = Quote & { items: QuoteItem[] };

export function useQuotes() {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (quotesError) throw quotesError;

      // Get items for all quotes
      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*');
      
      if (itemsError) throw itemsError;

      // Combine quotes with their items
      return (quotes || []).map(quote => ({
        ...quote,
        items: (items || []).filter(item => item.quote_id === quote.id),
      })) as QuoteWithItems[];
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (quoteError) throw quoteError;

      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', id);
      
      if (itemsError) throw itemsError;

      return { ...quote, items: items || [] } as QuoteWithItems;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ items, ...quote }: InsertTables<'quotes'> & { items: Omit<InsertTables<'quote_items'>, 'quote_id'>[] }) => {
      // Create quote
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert(quote)
        .select()
        .single();
      
      if (quoteError) throw quoteError;

      // Create items
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(items.map(item => ({ ...item, quote_id: newQuote.id })));
        
        if (itemsError) throw itemsError;
      }

      return newQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, items, ...updates }: UpdateTables<'quotes'> & { id: string; items?: Omit<InsertTables<'quote_items'>, 'quote_id'>[] }) => {
      // Update quote
      const { data, error: quoteError } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (quoteError) throw quoteError;

      // If items provided, replace all items
      if (items) {
        // Delete existing items
        await supabase.from('quote_items').delete().eq('quote_id', id);
        
        // Insert new items
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(items.map(item => ({ ...item, quote_id: id })));
          
          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

