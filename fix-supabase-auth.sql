-- SQL to run in your Supabase SQL Editor to fix authentication
-- This disables email confirmation so users can login immediately after registration

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET email_confirm = false 
WHERE key = 'email_confirm';

-- Alternative: You can also disable this in Supabase Dashboard
-- Go to Authentication > Settings > Email Auth
-- Turn OFF "Enable email confirmations"