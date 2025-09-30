// Simple auth types for Supabase integration
export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

// Token storage helpers for Supabase session
export const getStoredSession = () => {
  try {
    const session = localStorage.getItem('supabase_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};

export const storeSession = (session: any) => {
  localStorage.setItem('supabase_session', JSON.stringify(session));
};

export const removeStoredSession = () => {
  localStorage.removeItem('supabase_session');
};