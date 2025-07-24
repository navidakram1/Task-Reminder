-- Add emoji column to tasks table
-- Run this in your Supabase SQL Editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS emoji TEXT;
