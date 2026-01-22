import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórios. Verifique o arquivo .env.local');
}

// Singleton para evitar múltiplas instâncias no hot reload
declare global {
  var __supabase: SupabaseClient<Database> | undefined;
}

export const supabase = globalThis.__supabase ?? createClient<Database>(supabaseUrl, supabaseAnonKey);

if (import.meta.env.DEV) {
  globalThis.__supabase = supabase;
}