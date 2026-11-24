import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role?: 'learner' | 'parent';
  age?: number;
  under13?: boolean;
  requiresAgeVerification?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  age: number;
  under_13: boolean;
  role: 'learner' | 'parent';
  parent_id: string | null;
  total_xp: number;
  level: number;
  level_title: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freeze_available: boolean;
  equipped_items: string[];
  unlocked_items: string[];
}

const COPPA_AGE_THRESHOLD = 13;
const MINIMUM_AGE = 5;

export const verifyAge = (age: number) => {
  if (age < MINIMUM_AGE) {
    return { isValid: false, requiresParentalConsent: false, age, message: `You must be at least ${MINIMUM_AGE} years old.` };
  }
  if (age < COPPA_AGE_THRESHOLD) {
    return { isValid: true, requiresParentalConsent: true, age, message: 'Parental consent required for users under 13.' };
  }
  return { isValid: true, requiresParentalConsent: false, age, message: 'Age verification successful.' };
};

export const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL || 'marathi-learning://'}auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) { callback(null); return; }
    const profile = await getUserProfile(session.user.id);
    callback({
      id: session.user.id,
      email: session.user.email ?? null,
      name: profile?.name ?? session.user.user_metadata?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? session.user.user_metadata?.avatar_url ?? null,
      role: profile?.role,
      age: profile?.age,
      under13: profile?.under_13,
      requiresAgeVerification: profile?.age === 0,
    });
  });
  return () => subscription.unsubscribe();
};

export const completeAgeVerification = async (
  userId: string,
  age: number,
  role: 'learner' | 'parent',
  parentId?: string
): Promise<void> => {
  const { isValid, requiresParentalConsent, message } = verifyAge(age);
  if (!isValid) throw new Error(message);

  const { error } = await supabase
    .from('users')
    .update({
      age,
      under_13: requiresParentalConsent,
      role,
      parent_id: parentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
};

export const linkParentChild = async (parentId: string, childId: string): Promise<void> => {
  const { error } = await supabase
    .from('parent_child_links')
    .insert({ parent_id: parentId, child_id: childId });
  if (error) throw error;

  await supabase.from('users').update({ parent_id: parentId }).eq('id', childId);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as UserProfile;
};

export const getSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
