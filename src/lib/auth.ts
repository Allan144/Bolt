import { supabase } from './supabase';
import { AppUser } from '../types';

export type { AppUser };

export const registerUser = async (email: string, password: string, displayName: string): Promise<AppUser> => {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Registration failed');

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{ id: authData.user.id, email, display_name: displayName, role: 'teacher' }])
    .select()
    .single();

  if (userError) throw new Error(userError.message);
  return userData as AppUser;
};

export const loginUser = async (email: string, password: string): Promise<AppUser> => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw new Error('Invalid email or password.');
  if (!authData.user) throw new Error('Login failed');

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (userError || !userData) {
    await supabase.auth.signOut();
    throw new Error('User profile not found.');
  }

  return userData as AppUser;
};

export const validateStoredAuth = async (): Promise<AppUser | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  return userData as AppUser | null;
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};
