-- Writing Timeline Platform - Row Level Security Policies
-- Migration: 003_rls.sql
-- Description: RLS policies for privacy-by-default architecture

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can view public profile information
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view public documents
CREATE POLICY "Public documents are viewable by everyone"
  ON documents FOR SELECT
  USING (is_public = true);

-- Users can create their own documents
CREATE POLICY "Users can create their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- WRITING_EVENTS POLICIES
-- ============================================================================

-- Users can view events for their own documents
CREATE POLICY "Users can view events for their own documents"
  ON writing_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = writing_events.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Anyone can view events for public documents
CREATE POLICY "Events for public documents are viewable by everyone"
  ON writing_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = writing_events.document_id
      AND documents.is_public = true
    )
  );

-- Users can insert events for their own documents
CREATE POLICY "Users can insert events for their own documents"
  ON writing_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = writing_events.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Events are immutable - no updates or deletes allowed
-- (CASCADE delete will handle cleanup when document is deleted)

-- ============================================================================
-- CHECKPOINTS POLICIES
-- ============================================================================

-- Users can view checkpoints for their own documents
CREATE POLICY "Users can view checkpoints for their own documents"
  ON checkpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = checkpoints.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Anyone can view checkpoints for public documents
CREATE POLICY "Checkpoints for public documents are viewable by everyone"
  ON checkpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = checkpoints.document_id
      AND documents.is_public = true
    )
  );

-- System can create checkpoints (service role)
CREATE POLICY "System can create checkpoints"
  ON checkpoints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = checkpoints.document_id
    )
  );

-- Checkpoints are immutable - no updates or deletes allowed
-- (CASCADE delete will handle cleanup when document is deleted)
