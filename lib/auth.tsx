import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase, Profile } from './supabase';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoadFailed: boolean;
  refreshProfile: () => Promise<void>;
};

const PROFILE_CACHE_KEY = '@vitatribe_profile_cache';

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  profileLoadFailed: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);

  // Offline-friendly: remember the last profile so a missing connection never looks like "no profile".
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        // Cache first: notification scheduling reads the role from it.
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        setProfile(data as Profile);
        setProfileLoadFailed(false);
        return;
      }
      // PGRST116 = no row (genuinely no profile yet); anything else is a transport/server failure.
      if (error && error.code !== 'PGRST116') throw error;
      setProfileLoadFailed(false);
    } catch (e) {
      console.log('[Auth] loadProfile failed:', e);
      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        const parsed = cached ? JSON.parse(cached) : null;
        if (parsed?.id === userId) {
          setProfile(parsed as Profile);
          setProfileLoadFailed(false);
          return;
        }
      } catch {}
      setProfileLoadFailed(true);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch((e) => {
      console.log('[Auth] getSession failed:', e);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setProfileLoadFailed(false);
        AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileLoadFailed, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
