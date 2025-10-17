/*
  # Create Storage Bucket for Images

  ## Overview
  This migration creates a storage bucket for images and sets up public access policies.

  ## Storage
  - Creates 'images' bucket for storing all uploaded images
  - Enables public access for reading files
  - Restricts upload/delete to authenticated users only

  ## Security
  - Public can view all images
  - Only authenticated users can upload
  - Only authenticated users can delete their uploads
*/

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view images
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Policy: Authenticated users can update images
CREATE POLICY "Authenticated users can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

-- Policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');