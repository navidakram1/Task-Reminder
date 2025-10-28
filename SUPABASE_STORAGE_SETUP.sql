-- ============================================
-- SUPABASE STORAGE SETUP FOR TASK COMPLETION PROOFS
-- ============================================
-- Run this in Supabase SQL Editor AFTER creating the 'task-proofs' bucket

-- 1. First, create the bucket in Supabase Dashboard:
--    - Go to Storage
--    - Click "New Bucket"
--    - Name: task-proofs
--    - Public bucket: YES (checked)
--    - Click "Create"

-- 2. Then run these policies:

-- Allow authenticated users to upload completion proofs
CREATE POLICY "Allow authenticated users to upload task proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-proofs');

-- Allow public read access to view completion proofs
CREATE POLICY "Allow public read access to task proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-proofs');

-- Allow users to update their own uploads
CREATE POLICY "Allow users to update own task proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task-proofs');

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own task proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-proofs');

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, verify policies were created:
-- SELECT * FROM storage.policies WHERE bucket_id = 'task-proofs';

