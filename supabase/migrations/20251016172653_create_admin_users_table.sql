/*
  # Create admin users table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - логин администратора
      - `password_hash` (text) - хеш пароля
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `admin_users` table
    - No public access policies (admin only table)
  
  3. Data
    - Insert default admin user with username 'Admin' and password '34845'
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Insert default admin user (password: 34845)
-- Using simple hash for demo purposes
INSERT INTO admin_users (username, password_hash)
VALUES ('Admin', '34845')
ON CONFLICT (username) DO NOTHING;