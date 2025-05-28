import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzyevfqfbnhzulgrncdl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWV2ZnFmYm5oenVsZ3JuY2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDU0OTQsImV4cCI6MjA1OTQyMTQ5NH0.UUY_-_Yz7uicLlazZl9m2WGKqxYIRw4DmBc-vygEfWQ'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)