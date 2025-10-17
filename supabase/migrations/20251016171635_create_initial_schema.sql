/*
  # Initial CMS Schema Setup

  ## Overview
  This migration creates the complete database schema for the fitness academy CMS system.
  It includes tables for site content, contacts, program cards, teachers, reviews, and company logos.

  ## New Tables
  
  ### 1. site_content
  - `id` (uuid, primary key)
  - `section` (text) - Section identifier (hero, documents, cta, footer)
  - `key` (text) - Content key within section
  - `value` (text) - Content value
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. contacts
  - `id` (uuid, primary key)
  - `type` (text) - Contact type (phone, whatsapp, telegram, email, address)
  - `label` (text) - Display label
  - `value` (text) - Contact value
  - `url` (text, nullable) - URL for links
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. program_cards
  - `id` (uuid, primary key)
  - `title` (text) - Card title
  - `description` (text) - Card description
  - `icon_url` (text, nullable) - URL to icon image in storage
  - `icon_svg` (text, nullable) - Inline SVG code
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 4. teachers
  - `id` (uuid, primary key)
  - `name` (text) - Teacher name
  - `bio` (text) - Teacher biography
  - `video_url` (text) - Video embed URL
  - `video_platform` (text) - Platform type (youtube, vk)
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 5. reviews
  - `id` (uuid, primary key)
  - `video_url` (text) - Video embed URL
  - `video_platform` (text) - Platform type (youtube, vk)
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. company_logos
  - `id` (uuid, primary key)
  - `name` (text) - Company name
  - `image_url` (text) - URL to logo image
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Public read access for all content
  - Authenticated users can insert, update, and delete
*/

-- Create site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section, key)
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create program_cards table
CREATE TABLE IF NOT EXISTS program_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon_url text,
  icon_svg text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text NOT NULL,
  video_url text NOT NULL,
  video_platform text NOT NULL DEFAULT 'vk',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  video_platform text NOT NULL DEFAULT 'youtube',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_logos table
CREATE TABLE IF NOT EXISTS company_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_logos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_content
CREATE POLICY "Public can view site content"
  ON site_content FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site content"
  ON site_content FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for contacts
CREATE POLICY "Public can view contacts"
  ON contacts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for program_cards
CREATE POLICY "Public can view program cards"
  ON program_cards FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert program cards"
  ON program_cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update program cards"
  ON program_cards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete program cards"
  ON program_cards FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for teachers
CREATE POLICY "Public can view teachers"
  ON teachers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert teachers"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teachers"
  ON teachers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete teachers"
  ON teachers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for reviews
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for company_logos
CREATE POLICY "Public can view company logos"
  ON company_logos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert company logos"
  ON company_logos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update company logos"
  ON company_logos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete company logos"
  ON company_logos FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_program_cards_order ON program_cards(order_index);
CREATE INDEX IF NOT EXISTS idx_teachers_order ON teachers(order_index);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_index);
CREATE INDEX IF NOT EXISTS idx_company_logos_order ON company_logos(order_index);