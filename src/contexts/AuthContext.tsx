import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const initialised = useRef(false);

  const checkAdminRole = useCallback(async (userId: string) => {
    // Check sessionStorage cache first to avoid blocking render
    const cacheKey = `admin_role_${userId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      // Still verify in background but return cached value immediately
      const cachedResult = cached === 'true';
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle()
        .then(({ data }) => {
          const fresh = !!data;
          if (fresh !== cachedResult) {
            sessionStorage.setItem(cacheKey, String(fresh));
            setIsAdmin(fresh);
          }
        });
      return cachedResult;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    const result = !!data;
    sessionStorage.setItem(cacheKey, String(result));
    return result;
  }, []);

  useEffect(() => {
    // Get the initial session once, then let the listener handle changes
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (initialised.current) return;
      initialised.current = true;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const admin = await checkAdminRole(session.user.id);
        setIsAdmin(admin);
      }
      setLoading(false);
    });

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip if this is the very first event (already handled above)
      if (!initialised.current) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const admin = await checkAdminRole(session.user.id);
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mini-ats/auth`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const signOut = async () => {
    // Clear cached admin role
    if (user?.id) {
      sessionStorage.removeItem(`admin_role_${user.id}`);
    }
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    if (!user?.id) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      return { error };
    }

    sessionStorage.removeItem(`admin_role_${user.id}`);
    await supabase.auth.signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        signUp,
        signIn,
        resetPassword,
        updatePassword,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
