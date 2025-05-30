import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database table definitions that match your schema
export interface DatabaseUser {
  id: number;
  email: string;
  hashed_password: string;
  agents_created: number;
  created_at: string;
}

export interface DatabaseAgent {
  id: number;
  user_id: number;
  name: string;
  python_script: string;
  created_at: string;
}