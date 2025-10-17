/*
  # Update RLS policies to allow anonymous access

  1. Changes
    - Drop all existing authenticated-only policies
    - Add new policies that allow anonymous users to perform all operations
    - This is necessary because we switched from Supabase Auth to custom session-based auth
  
  2. Security Note
    - Access control is now handled at the application level via session storage
    - Consider implementing proper API authentication in production
*/

-- Site Content
DROP POLICY IF EXISTS "Authenticated users can insert site content" ON site_content;
DROP POLICY IF EXISTS "Authenticated users can update site content" ON site_content;
DROP POLICY IF EXISTS "Authenticated users can delete site content" ON site_content;

CREATE POLICY "Allow all operations on site content"
  ON site_content
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Contacts
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON contacts;

CREATE POLICY "Allow all operations on contacts"
  ON contacts
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Program Cards
DROP POLICY IF EXISTS "Authenticated users can insert program cards" ON program_cards;
DROP POLICY IF EXISTS "Authenticated users can update program cards" ON program_cards;
DROP POLICY IF EXISTS "Authenticated users can delete program cards" ON program_cards;

CREATE POLICY "Allow all operations on program cards"
  ON program_cards
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Teachers
DROP POLICY IF EXISTS "Authenticated users can insert teachers" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can update teachers" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can delete teachers" ON teachers;

CREATE POLICY "Allow all operations on teachers"
  ON teachers
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Reviews
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON reviews;

CREATE POLICY "Allow all operations on reviews"
  ON reviews
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Company Logos
DROP POLICY IF EXISTS "Authenticated users can insert company logos" ON company_logos;
DROP POLICY IF EXISTS "Authenticated users can update company logos" ON company_logos;
DROP POLICY IF EXISTS "Authenticated users can delete company logos" ON company_logos;

CREATE POLICY "Allow all operations on company logos"
  ON company_logos
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);