-- Writing Timeline Platform - Document Schema Update
-- Migration: 005_document_schema_update.sql
-- Description: Update documents table to match OpenAPI specification with status and visibility fields

-- Add new columns to documents table
ALTER TABLE documents 
ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
ADD COLUMN published_at TIMESTAMP;

-- Migrate existing data: convert is_public to new fields
UPDATE documents 
SET 
  status = 'published',
  visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END,
  published_at = CASE WHEN is_public THEN created_at ELSE NULL END;

-- Create indexes for new fields
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_visibility ON documents(visibility);
CREATE INDEX idx_documents_published_at ON documents(published_at DESC);
CREATE INDEX idx_documents_user_status ON documents(user_id, status);
CREATE INDEX idx_documents_user_visibility ON documents(user_id, visibility);

-- Update RLS policies to use new visibility field
DROP POLICY IF EXISTS "Public documents are viewable by everyone" ON documents;
CREATE POLICY "Public documents are viewable by everyone"
  ON documents FOR SELECT
  USING (visibility = 'public');

-- Update events RLS policy
DROP POLICY IF EXISTS "Events for public documents are viewable by everyone" ON writing_events;
CREATE POLICY "Events for public documents are viewable by everyone"
  ON writing_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = writing_events.document_id
      AND documents.visibility = 'public'
    )
  );

-- Update checkpoints RLS policy
DROP POLICY IF EXISTS "Checkpoints for public documents are viewable by everyone" ON checkpoints;
CREATE POLICY "Checkpoints for public documents are viewable by everyone"
  ON checkpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = checkpoints.document_id
      AND documents.visibility = 'public'
    )
  );

-- Add function to automatically set published_at when status changes to 'published'
CREATE OR REPLACE FUNCTION update_document_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at = NOW();
  END IF;
  
  -- Clear published_at when status changes away from 'published'
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for published_at updates
CREATE TRIGGER update_document_published_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_published_at();

-- Note: We'll keep the is_public column for now to avoid breaking existing code
-- It can be removed in a future migration after updating all API routes
