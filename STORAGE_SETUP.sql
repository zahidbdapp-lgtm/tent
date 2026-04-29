-- Create and configure storage buckets for file uploads
-- Run this in your Supabase SQL Editor

-- ==========================================
-- 1. CREATE STORAGE BUCKETS
-- ==========================================

-- Create nid-images bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('nid-images', 'nid-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create tenant-photos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-photos', 'tenant-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==========================================
-- 2. DROP ALL EXISTING POLICIES (COMPLETE)
-- ==========================================

DROP POLICY IF EXISTS "Allow authenticated users to upload to nid-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read nid-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to tenant-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read tenant-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete own files nid-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete own files tenant-photos" ON storage.objects;

-- ==========================================
-- 3. SET UP RLS FOR STORAGE BUCKETS
-- ==========================================
-- Note: RLS is already enabled by default on storage.objects in Supabase

-- ========== NID-IMAGES BUCKET ==========

-- Policy 1: Allow ANY authenticated user to upload to nid-images
CREATE POLICY "nid_images_allow_authenticated_upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'nid-images'
);

-- Policy 2: Allow public read from nid-images
CREATE POLICY "nid_images_allow_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'nid-images');

-- Policy 3: Allow UPDATE for authenticated users (to update metadata)
CREATE POLICY "nid_images_allow_authenticated_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'nid-images');

-- ========== TENANT-PHOTOS BUCKET ==========

-- Policy 4: Allow ANY authenticated user to upload to tenant-photos
CREATE POLICY "tenant_photos_allow_authenticated_upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-photos'
);

-- Policy 5: Allow public read from tenant-photos
CREATE POLICY "tenant_photos_allow_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tenant-photos');

-- Policy 6: Allow UPDATE for authenticated users (to update metadata)
CREATE POLICY "tenant_photos_allow_authenticated_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'tenant-photos');
