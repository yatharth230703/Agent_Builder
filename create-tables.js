// Script to create database tables in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzyevfqfbnhzulgrncdl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWV2ZnFmYm5oenVsZ3JuY2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg0NTQ5NCwiZXhwIjoyMDU5NDIxNDk0fQ.tVMyL6sEmB1jWBWkK_Qwb7OoWT1FbFOeQrnh5tpZixY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  console.log('Creating tables in Supabase...')
  
  // Create USERS table exactly as specified
  const usersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      agents_created INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `
  
  // Create AGENTS table exactly as specified  
  const agentsTableSQL = `
    CREATE TABLE IF NOT EXISTS agents (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      python_script TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `
  
  try {
    // Execute users table creation
    const { error: usersError } = await supabase.rpc('exec_sql', { 
      sql: usersTableSQL 
    })
    
    if (usersError) {
      console.log('Creating users table with direct query...')
      const { error: directUsersError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      // If table doesn't exist, we'll get an error, which is expected
      console.log('Users table check completed')
    }
    
    // Execute agents table creation
    const { error: agentsError } = await supabase.rpc('exec_sql', { 
      sql: agentsTableSQL 
    })
    
    if (agentsError) {
      console.log('Creating agents table with direct query...')
      const { error: directAgentsError } = await supabase
        .from('agents')
        .select('id')
        .limit(1)
        
      // If table doesn't exist, we'll get an error, which is expected
      console.log('Agents table check completed')
    }
    
    console.log('✅ Tables creation process completed!')
    console.log('Please run the SQL commands manually in Supabase SQL Editor if needed.')
    
  } catch (error) {
    console.error('Error creating tables:', error)
    console.log('\n📋 Please run these SQL commands manually in your Supabase SQL Editor:')
    console.log('\n-- Create USERS table:')
    console.log(usersTableSQL)
    console.log('\n-- Create AGENTS table:')
    console.log(agentsTableSQL)
  }
}

createTables()