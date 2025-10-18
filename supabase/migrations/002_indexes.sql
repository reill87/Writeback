-- Writing Timeline Platform - Performance Indexes
-- Migration: 002_indexes.sql
-- Description: Indexes for query optimization

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Documents indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_last_edited_at ON documents(last_edited_at DESC);
CREATE INDEX idx_documents_is_public ON documents(is_public) WHERE is_public = true;
CREATE INDEX idx_documents_user_public ON documents(user_id, is_public);

-- Writing events indexes (critical for playback performance)
CREATE INDEX idx_events_document_id ON writing_events(document_id);
CREATE INDEX idx_events_document_timestamp ON writing_events(document_id, timestamp ASC);
CREATE INDEX idx_events_session_id ON writing_events(session_id);
CREATE INDEX idx_events_created_at ON writing_events(created_at DESC);

-- Checkpoints indexes
CREATE INDEX idx_checkpoints_document_id ON checkpoints(document_id);
CREATE INDEX idx_checkpoints_document_event_count ON checkpoints(document_id, event_count DESC);
CREATE INDEX idx_checkpoints_created_at ON checkpoints(created_at DESC);
