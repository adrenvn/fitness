/*
  # Create Storage Bucket for Documents

  1. Storage
    - Creates 'documents' bucket for storing uploaded documents
    - Enables public access for reading files
    - Allows anonymous users to upload/delete
  
  2. Security
    - Public can view all documents
    - Anonymous users can upload/delete (for admin panel)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Allow anonymous upload to documents bucket"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow anonymous update to documents bucket"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow anonymous delete from documents bucket"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'documents');