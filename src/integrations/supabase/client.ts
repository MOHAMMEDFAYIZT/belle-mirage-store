import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing env.VITE_SUPABASE_URL');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing env.VITE_SUPABASE_ANON_KEY');
}

// Determine redirect URL based on environment
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    // Use current origin for production, fallback for development
    return `${window.location.origin}/auth/callback`;
  }
  return import.meta.env.PROD 
    ? 'https://your-vercel-app.vercel.app/auth/callback'
    : 'http://localhost:5173/auth/callback';
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce', // IMPORTANT: Use PKCE for OAuth in production
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    // This is CRITICAL for production OAuth
    redirectTo: getRedirectUrl()
  }
});