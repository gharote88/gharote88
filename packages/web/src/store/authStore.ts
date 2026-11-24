import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  age?: number;
  under13?: boolean;
  role: 'learner' | 'parent';
}

interface XpState {
  totalXp: number;
  level: number;
  levelTitle: string;
}

interface AuthStore {
  user: AppUser | null;
  session: Session | null;
  xp: XpState | null;
  loading: boolean;
  initialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  init: () => () => void;
  refreshXp: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  xp: null,
  loading: false,
  initialized: false,

  init: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          session,
          user: data ? {
            id: data.id,
            name: data.name || session.user.user_metadata?.full_name || '',
            email: data.email || session.user.email || '',
            avatarUrl: data.avatar_url || session.user.user_metadata?.avatar_url,
            age: data.age,
            under13: data.under_13,
            role: data.role || 'learner',
          } : null,
          initialized: true,
        });

        get().refreshXp();
      } else {
        set({ session: null, user: null, xp: null, initialized: true });
      }
    });

    return () => subscription.unsubscribe();
  },

  login: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, xp: null });
  },

  refreshXp: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('total_xp, level, level_title')
        .eq('id', user.id)
        .single();
      if (data) {
        set({ xp: { totalXp: data.total_xp || 0, level: data.level || 1, levelTitle: data.level_title || 'Beginner' } });
      }
    } catch {}
  },
}));
