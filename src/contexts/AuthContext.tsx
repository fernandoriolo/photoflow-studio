import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const STORAGE_KEY = 'app-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isFetchingProfile = useRef(false);

  const fetchProfileDirect = async (userId: string, accessToken: string): Promise<Profile | null> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      return data?.[0] || null;
    } catch (err) {
      console.error('Erro ao buscar perfil direto:', err);
      return null;
    }
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (isFetchingProfile.current) return profile;
    isFetchingProfile.current = true;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      isFetchingProfile.current = false;
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      isFetchingProfile.current = false;
      console.error('Erro inesperado ao buscar perfil:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const handleSession = async (currentSession: Session | null) => {
      if (!mounted || initialized) return;
      initialized = true;
      
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        const profileData = await fetchProfile(currentSession.user.id);
        if (mounted) setProfile(profileData);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      if (mounted) setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event);
        
        if (!mounted) return;

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && !initialized) {
          await handleSession(newSession);
          return;
        }

        if (event === 'SIGNED_OUT') {
          initialized = false;
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    // Fallback: usar sessão do storage diretamente após 2s
    const timeout = setTimeout(async () => {
      if (mounted && !initialized) {
        console.warn('Fallback: usando sessão do storage');
        initialized = true;
        
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const sessionData = JSON.parse(stored);
            if (sessionData?.user && sessionData?.access_token) {
              setSession(sessionData as Session);
              setUser(sessionData.user as User);
              
              const profileData = await fetchProfileDirect(
                sessionData.user.id, 
                sessionData.access_token
              );
              if (mounted) setProfile(profileData);
            }
          }
        } catch (err) {
          console.error('Erro ao ler storage:', err);
        }
        
        if (mounted) setIsLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

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
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
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