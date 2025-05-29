import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // these are the defaults, so you only need this if you've overridden them elsewhere
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});