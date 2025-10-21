import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DocumentInsert } from '@/types/supabase';

/**
 * GET /api/documents
 *
 * List documents for the authenticated user
 *
 * Query params:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - public_only: boolean (optional, filter for public documents)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');

    // Build query
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('last_edited_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status as 'draft' | 'published' | 'archived');
    }
    if (visibility && ['private', 'public', 'unlisted'].includes(visibility)) {
      query = query.eq('visibility', visibility as 'private' | 'public' | 'unlisted');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 *
 * Create a new document
 *
 * Body:
 * {
 *   title: string (required)
 *   status?: 'draft' | 'published' | 'archived' (default: 'draft')
 *   visibility?: 'private' | 'public' | 'unlisted' (default: 'private')
 *   metadata?: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      title, 
      status = 'draft', 
      visibility = 'private', 
      metadata = {} 
    } = body;

    // Validate
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Validate status and visibility
    if (!['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be draft, published, or archived' },
        { status: 400 }
      );
    }

    if (!['private', 'public', 'unlisted'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Visibility must be private, public, or unlisted' },
        { status: 400 }
      );
    }

    // Create document
    const newDocument: DocumentInsert = {
      user_id: user.id,
      title: title.trim(),
      status: status as 'draft' | 'published' | 'archived',
      visibility: visibility as 'private' | 'public' | 'unlisted',
      metadata,
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(newDocument)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
