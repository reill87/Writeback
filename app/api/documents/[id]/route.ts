import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DocumentUpdate } from '@/types/supabase';

/**
 * GET /api/documents/[id]
 *
 * Fetch a single document by ID
 *
 * Access control:
 * - Owner can access any of their documents
 * - Anyone can access public documents (is_public = true)
 * - Returns 404 for private documents owned by others
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user (may be null for unauthenticated requests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check access: owner or public visibility
    const hasAccess = document.user_id === user?.id || document.visibility === 'public';

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id]
 *
 * Update a document (title, is_public, metadata)
 *
 * Requires authentication and ownership.
 *
 * Body:
 * {
 *   title?: string
 *   is_public?: boolean
 *   metadata?: object
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this document' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, status, visibility, metadata } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          { error: 'Title must be 200 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        return NextResponse.json(
          { error: 'Status must be draft, published, or archived' },
          { status: 400 }
        );
      }
    }

    // Validate visibility if provided
    if (visibility !== undefined) {
      if (!['private', 'public', 'unlisted'].includes(visibility)) {
        return NextResponse.json(
          { error: 'Visibility must be private, public, or unlisted' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: DocumentUpdate = {};
    if (title !== undefined) updates.title = title.trim();
    if (status !== undefined) updates.status = status;
    if (visibility !== undefined) {
      updates.visibility = visibility;
      updates.is_public = visibility === 'public'; // Keep is_public for backward compatibility
    }
    if (metadata !== undefined) updates.metadata = metadata;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update document
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 *
 * Delete a document and all its events (CASCADE)
 *
 * Requires authentication and ownership.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this document' },
        { status: 403 }
      );
    }

    // Delete document (CASCADE will delete events and checkpoints)
    const { error } = await supabase.from('documents').delete().eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
