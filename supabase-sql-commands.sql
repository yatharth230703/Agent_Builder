-- PHIL Platform Database Setup
-- Copy and paste these commands into your Supabase SQL Editor

-- 1. Create USERS table exactly as specified
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  agents_created INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create AGENTS table exactly as specified  
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  python_script TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 4. Create security policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 5. Create security policies for agents table
CREATE POLICY "Users can view own agents" ON agents
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own agents" ON agents
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own agents" ON agents
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 6. Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON agents TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE agents_id_seq TO authenticated;