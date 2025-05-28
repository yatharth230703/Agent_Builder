-- Create USERS table exactly as specified in your schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  agents_created INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AGENTS table exactly as specified in your schema  
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  python_script TEXT NOT NULL, -- the final agent code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for agents table
CREATE POLICY "Users can view own agents" ON agents
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own agents" ON agents
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own agents" ON agents
  FOR DELETE USING (auth.uid()::text = user_id::text);