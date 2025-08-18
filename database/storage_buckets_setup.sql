-- Supabase Storage Buckets Setup for SplitDuty
-- Run this SQL in your Supabase SQL Editor

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('receipts', 'receipts', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('task-proofs', 'task-proofs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile photos
CREATE POLICY "Users can view all profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile photo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile photo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for receipts
CREATE POLICY "Household members can view receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' 
    AND EXISTS (
      SELECT 1 FROM bills b
      JOIN household_members hm ON b.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
      AND b.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Users can upload receipts for their bills" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts'
    AND EXISTS (
      SELECT 1 FROM bills b
      WHERE b.paid_by = auth.uid()
      AND b.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Bill creators can update receipts" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'receipts'
    AND EXISTS (
      SELECT 1 FROM bills b
      WHERE b.paid_by = auth.uid()
      AND b.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Bill creators can delete receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts'
    AND EXISTS (
      SELECT 1 FROM bills b
      WHERE b.paid_by = auth.uid()
      AND b.id::text = (storage.foldername(name))[2]
    )
  );

-- Create storage policies for task proofs
CREATE POLICY "Household members can view task proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-proofs'
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN household_members hm ON t.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Task assignees can upload proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-proofs'
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE (t.assignee_id = auth.uid() OR t.created_by = auth.uid())
      AND t.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Task assignees can update proofs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-proofs'
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE (t.assignee_id = auth.uid() OR t.created_by = auth.uid())
      AND t.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Task assignees can delete proofs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-proofs'
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE (t.assignee_id = auth.uid() OR t.created_by = auth.uid())
      AND t.id::text = (storage.foldername(name))[2]
    )
  );

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Clean up profile photos for deleted users
  DELETE FROM storage.objects 
  WHERE bucket_id = 'profile-photos'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id::text = (storage.foldername(name))[1]
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up receipts for deleted bills
  DELETE FROM storage.objects 
  WHERE bucket_id = 'receipts'
  AND NOT EXISTS (
    SELECT 1 FROM bills 
    WHERE id::text = (storage.foldername(name))[2]
  );
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Clean up task proofs for deleted tasks
  DELETE FROM storage.objects 
  WHERE bucket_id = 'task-proofs'
  AND NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id::text = (storage.foldername(name))[2]
  );
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_orphaned_files() TO service_role;

-- Create a function to get storage usage stats
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bucket_id as bucket_name,
    COUNT(*) as file_count,
    ROUND(SUM(metadata->>'size')::NUMERIC / 1024 / 1024, 2) as total_size_mb
  FROM storage.objects 
  WHERE bucket_id IN ('profile-photos', 'receipts', 'task-proofs')
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_storage_stats() TO authenticated;
