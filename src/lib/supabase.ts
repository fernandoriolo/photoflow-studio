import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórios. Verifique o arquivo .env.local');
}

// Limpar instância antiga no hot reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    delete globalThis.__supabase;
  });
}

function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'app-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

declare global {
  var __supabase: SupabaseClient<Database> | undefined;
}

export const supabase = globalThis.__supabase ?? createSupabaseClient();
globalThis.__supabase = supabase;