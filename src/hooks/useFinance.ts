import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Transaction, FinanceCategory, TransactionType, TransactionStatus } from '@/types/database';

// Categories
export function useFinanceCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['finance_categories', type],
    queryFn: async () => {
      let query = supabase.from('finance_categories').select('*').order('name');
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FinanceCategory[];
    },
  });
}

// Transactions
export function useTransactions(filters?: {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:finance_categories(*)
        `)
        .order('date', { ascending: false });
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:finance_categories(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

interface CreateTransactionData {
  description: string;
  amount: number;
  type: TransactionType;
  category_id?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  date: string;
  payment_method?: string | null;
  status?: TransactionStatus;
  notes?: string | null;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: CreateTransactionData) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateTransactionData> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// Summary/Stats
export function useFinanceSummary(period?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['finance_summary', period],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('status', 'paid');
      
      if (period?.startDate) {
        query = query.gte('date', period.startDate);
      }
      if (period?.endDate) {
        query = query.lte('date', period.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const income = data
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const expense = data
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      return {
        income,
        expense,
        balance: income - expense,
        transactionCount: data?.length || 0,
      };
    },
  });
}

