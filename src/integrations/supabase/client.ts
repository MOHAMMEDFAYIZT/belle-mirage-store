import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing env.VITE_SUPABASE_URL");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("Missing env.VITE_SUPABASE_ANON_KEY");
}

// Decide redirect URL for auth callbacks
const getRedirectUrl = () => {
  // Client-side (browser)
  if (typeof window !== "undefined") {
    const url = `${window.location.origin}/auth/callback`;
    console.log("[supabase] redirect URL:", url);
    return url;
  }

  // During build / SSR: just return a sensible default
  return import.meta.env.PROD
    ? "https://belle-mirage-store.vercel.app/auth/callback"
    : "http://localhost:8080/auth/callback";
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",               // recommended for OAuth
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage:
      typeof window !== "undefined" ? window.localStorage : undefined,
    redirectTo: getRedirectUrl(),   // CRITICAL for Google sign-in
  },
});
