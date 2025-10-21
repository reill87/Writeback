# Document Schema Migration Guide

## Overview

This guide explains the schema migration from the simple `is_public` boolean field to a more sophisticated document model with `status` and `visibility` fields that match the OpenAPI specification.

## Changes Made

### 1. Database Schema Updates

**Migration 005**: `005_document_schema_update.sql`
- Added `status` column: `'draft' | 'published' | 'archived'` (default: 'draft')
- Added `visibility` column: `'private' | 'public' | 'unlisted'` (default: 'private')
- Added `published_at` timestamp column
- Migrated existing data: `is_public = true` → `status = 'published'`, `visibility = 'public'`
- Updated RLS policies to use `visibility` instead of `is_public`
- Added indexes for new fields
- Added trigger to automatically set `published_at` when status changes to 'published'

**Migration 006**: `006_remove_is_public_column.sql` (to be run later)
- Removes the legacy `is_public` column after all code is updated

### 2. TypeScript Types Updates

Updated `types/supabase.ts`:
- Added `status`, `visibility`, and `published_at` fields to Document types
- Maintained backward compatibility by keeping `is_public` field

### 3. API Route Updates

**GET /api/documents**:
- Updated query parameters to support `status` and `visibility` filters
- Replaced `public_only` parameter with `visibility` parameter

**POST /api/documents**:
- Updated request body to accept `status` and `visibility` fields
- Added validation for new fields
- Maintains backward compatibility by setting `is_public` based on `visibility`

**PATCH /api/documents/[id]**:
- Updated to accept `status` and `visibility` in request body
- Added validation for new fields
- Updated access control to use `visibility` instead of `is_public`

**GET /api/documents/[id]**:
- Updated access control to use `visibility` instead of `is_public`

### 4. OpenAPI Specification Updates

Updated `specs/001-mvp-core/contracts/documents.yaml`:
- Added `visibility` query parameter to GET /documents
- Added `status` and `visibility` fields to POST request body
- All schemas now match the implementation

## Migration Steps

### Step 1: Apply Database Migrations
```bash
# Apply the schema update migration
supabase db push

# Or if using local development:
supabase migration up
```

### Step 2: Verify Data Migration
Check that existing documents were properly migrated:
```sql
-- Verify migration worked correctly
SELECT 
  id, 
  title, 
  is_public, 
  status, 
  visibility, 
  published_at 
FROM documents 
LIMIT 10;
```

### Step 3: Test API Endpoints
Test the updated API endpoints to ensure they work with the new schema:

```bash
# Test creating a document with new fields
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Test Document",
    "status": "draft",
    "visibility": "private"
  }'

# Test filtering by status and visibility
curl "http://localhost:3000/api/documents?status=draft&visibility=private" \
  -H "Authorization: Bearer <token>"
```

### Step 4: Update Client Code (if needed)
If you have client code that uses the old `is_public` field, update it to use the new `status` and `visibility` fields.

### Step 5: Remove Legacy Column (Optional)
After all code is updated, you can remove the legacy `is_public` column:
```bash
# Apply the cleanup migration
supabase migration up
```

## Backward Compatibility

The migration maintains backward compatibility by:
1. Keeping the `is_public` column during the transition
2. Automatically setting `is_public` based on `visibility` in API routes
3. Migrating existing data to preserve current behavior

## Field Mappings

| Old Field | New Fields | Notes |
|-----------|------------|-------|
| `is_public: true` | `status: 'published'`, `visibility: 'public'` | Published and public |
| `is_public: false` | `status: 'draft'`, `visibility: 'private'` | Draft and private |

## New Capabilities

The new schema enables:
- **Status tracking**: `draft` → `published` → `archived`
- **Flexible visibility**: `private`, `public`, `unlisted`
- **Publication tracking**: `published_at` timestamp
- **Better filtering**: Filter by status and visibility independently

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting the API route changes
2. Dropping the new columns: `ALTER TABLE documents DROP COLUMN status, visibility, published_at;`
3. Restoring the old RLS policies

However, this would lose the new functionality and any data in the new fields.
