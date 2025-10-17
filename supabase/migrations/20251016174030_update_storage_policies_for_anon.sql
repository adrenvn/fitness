/*
  # Update Storage policies to allow anonymous access

  1. Changes
    - Drop existing authenticated-only policies for storage
    - Add new policies that allow anonymous users to upload, update, and delete images
    - This is necessary because we switched from Supabase Auth to custom session-based auth
  
  2. Security Note
    - Access control is now handled at the application level via session storage
    - All storage operations are now allowed for anonymous users
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Allow anonymous users to upload images
CREATE POLICY "Allow anonymous upload to images bucket"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow anonymous users to update images
CREATE POLICY "Allow anonymous update to images bucket"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

-- Allow anonymous users to delete images
CREATE POLICY "Allow anonymous delete from images bucket"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'images');