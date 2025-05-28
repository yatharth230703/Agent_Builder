import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzyevfqfbnhzulgrncdl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWV2ZnFmYm5oenVsZ3JuY2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg0NTQ5NCwiZXhwIjoyMDU5NDIxNDk0fQ.tVMyL6sEmB1jWBWkK_Qwb7OoWT1FbFOeQrnh5tpZixY'

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