import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        // Se for erro de autenticação, limpar sessão
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          await supabase.auth.signOut();
        }
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err);
      return null;
    }
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança para evitar loading infinito
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Timeout de autenticação - limpando estado');
        clearAuthState();
      }
    }, 10000); // 10 segundos máximo

    // Verificar sessão inicial
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) clearAuthState();
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
            setIsLoading(false);
          }
        } else {
          clearAuthState();
        }
      } catch (err) {
        console.error('Erro ao inicializar sessão:', err);
        if (mounted) clearAuthState();
      }
    };

    initSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        if (!mounted) return;

        console.log('Auth event:', event);

        // Se a sessão expirou ou foi invalidada
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          clearAuthState();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
        
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile, clearAuthState]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'cliente') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      // Sempre limpar o estado local, mesmo se o signOut falhar
      setUser(null);
      setProfile(null);
      setSession(null);
      // Limpar storage do Supabase
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
    }
  };

  const hasAccess = (requiredRoles: UserRole[]) => {
    if (!profile) return false;
    return requiredRoles.includes(profile.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

