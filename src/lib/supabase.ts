import { createClient } from '@supabase/supabase-js';
import { AuthUser, getStoredSession, storeSession, removeStoredSession } from './auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type User = {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type Prescription = {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DoseSchedule = {
  id: string;
  prescription_id: string;
  dose_time: string;
  quantity: number;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
};

export type MedicationLog = {
  id: string;
  prescription_id: string;
  user_id: string;
  scheduled_time: string;
  taken_time?: string;
  quantity_taken?: number;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  is_time_corrected: boolean;
  notes: string;
  created_at: string;
};

export type MedicationHistory = {
  id: string;
  user_id: string;
  prescription_id: string;
  prescription_name: string;
  dosage: string;
  scheduled_date: string;
  scheduled_time: string;
  actual_taken_datetime: string;
  quantity_taken: number;
  is_corrected: boolean;
  notes: string;
  created_at: string;
};

// Authentication functions using Supabase Auth
export const registerUser = async (username: string, password: string, fullName?: string): Promise<AuthUser> => {
  try {
    // Check if username already exists in our custom users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username already exists. Please try logging in instead.');
    }

    // Create a unique email for Supabase auth (required by Supabase)
    const email = `${username.toLowerCase()}@medreminder.local`;

    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Registration failed - no user data returned');
    }

    // Create user profile in our custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        username,
        full_name: fullName || ''
      }])
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    const authUser: AuthUser = {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };

    // Store session
    if (authData.session) {
      storeSession(authData.session);
    }

    return authUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (username: string, password: string): Promise<AuthUser> => {
  try {
    console.log('Login attempt for username:', username);
    
    // Use the generated email for Supabase auth
    const email = `${username.toLowerCase()}@medreminder.local`;
    console.log('Attempting Supabase auth with email:', email);

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Supabase auth result:', { authData: !!authData.user, authError });

    if (authError) {
      console.log('Supabase auth error:', authError.message);
      throw new Error('Incorrect username or password.');
    }

    if (!authData.user || !authData.session) {
      console.log('No user or session returned from Supabase');
      throw new Error('Login failed - no session data returned');
    }

    // Get user profile from custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    console.log('User profile lookup result:', { userData, userError });

    if (userError || !userData) {
      console.log('User profile not found, signing out from Supabase Auth');
      // Sign out from Supabase Auth since profile is missing
      await supabase.auth.signOut();
      throw new Error('User profile not found. Please contact support.');
    }

    const authUser: AuthUser = {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };

    // Store session
    storeSession(authData.session);

    return authUser;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const validateStoredAuth = async (): Promise<AuthUser | null> => {
  try {
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Check for specific refresh token errors
      if (error.message && (
        error.message.includes('Invalid Refresh Token') ||
        error.message.includes('Refresh Token Not Found') ||
        error.message.includes('refresh_token_not_found')
      ) || (error.code && error.code === 'refresh_token_not_found')) {
        console.warn('Refresh token invalid, clearing local session');
        removeStoredSession();
        return null;
      }
      throw error;
    }
    
    if (!session) {
      removeStoredSession();
      return null;
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (userError || !userData) {
      removeStoredSession();
      return null;
    }

    // Store/update session
    storeSession(session);

    return {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
  } catch (error) {
    console.error('Auth validation failed:', error);
    removeStoredSession();
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Check if the error is due to session not found (expected when session is already invalid)
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('session_not_found')) {
      console.warn('Session already invalid on server, clearing local session');
    } else {
      console.error('Sign out error:', error);
    }
  } finally {
    // Always clear local session regardless of server response
    removeStoredSession();
  }
};

// Helper functions for scheduling
export const generateScheduledTimes = (
  schedules: DoseSchedule[],
  date: Date
): Date[] => {
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
  
  return schedules
    .filter(schedule => 
      schedule.is_active && 
      schedule.days_of_week.includes(dayOfWeek)
    )
    .map(schedule => {
      const [hours, minutes] = schedule.dose_time.split(':').map(Number);
      const time = new Date(date);
      time.setHours(hours, minutes, 0, 0);
      return time;
    })
    .sort((a, b) => a.getTime() - b.getTime());
};