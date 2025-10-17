/*
  # Create documents table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `title` (text) - название документа
      - `file_url` (text) - URL файла
      - `file_name` (text) - имя файла
      - `order_index` (integer) - порядок отображения
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `documents` table
    - Allow anonymous users to read documents
    - Allow anonymous users to manage documents (for admin panel)
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on documents"
  ON documents
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);