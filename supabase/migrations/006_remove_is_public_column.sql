-- Writing Timeline Platform - Remove Legacy is_public Column
-- Migration: 006_remove_is_public_column.sql
-- Description: Remove the legacy is_public column after migration to status/visibility fields

-- This migration should be run after all API routes and client code
-- have been updated to use the new status and visibility fields.

-- Drop the legacy is_public column
ALTER TABLE documents DROP COLUMN is_public;

-- Update indexes that referenced is_public
DROP INDEX IF EXISTS idx_documents_is_public;
DROP INDEX IF EXISTS idx_documents_user_public;

-- Note: The new indexes for status and visibility were already created in migration 005
