-- Writing Timeline Platform - Database Schema
-- Migration: 001_schema.sql
-- Description: Core tables for user profiles, documents, events, and checkpoints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_edited_at TIMESTAMP DEFAULT NOW()
);

-- Writing events table (event sourcing)
CREATE TABLE writing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  timestamp BIGINT NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('insert', 'delete', 'replace')),
  position INTEGER NOT NULL CHECK (position >= 0),
  content TEXT,
  content_before TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Checkpoints table (performance optimization)
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  event_count INTEGER NOT NULL,
  full_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update documents.last_edited_at when events are added
CREATE OR REPLACE FUNCTION update_document_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documents
  SET last_edited_at = NOW()
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_on_event
  AFTER INSERT ON writing_events
  FOR EACH ROW
  EXECUTE FUNCTION update_document_last_edited();
