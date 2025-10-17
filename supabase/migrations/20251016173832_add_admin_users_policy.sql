/*
  # Add RLS policy for admin_users table

  1. Security
    - Add policy to allow anonymous users to read admin_users table
    - This is needed for login functionality
*/

DROP POLICY IF EXISTS "Allow anonymous read for admin login" ON admin_users;

CREATE POLICY "Allow anonymous read for admin login"
  ON admin_users
  FOR SELECT
  TO anon
  USING (true);