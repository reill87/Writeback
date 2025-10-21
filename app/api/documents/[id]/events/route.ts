import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EventBatchRequest, EventBatchResponse } from '@/types/events';
import type { WritingEventInsert } from '@/types/supabase';

/**
 * POST /api/documents/[id]/events
 *
 * Batch upload writing events for a document
 *
 * Body: EventBatchRequest
 * {
 *   document_id: string
 *   events: WritingEventInsert[]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
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
    const body: EventBatchRequest = await request.json();

    // Validate
    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (body.document_id !== documentId) {
      return NextResponse.json(
        { error: 'Document ID mismatch' },
        { status: 400 }
      );
    }

    // Check document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
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

    // Validate each event
    const validEvents: WritingEventInsert[] = [];
    const failedEvents: string[] = [];

    for (const event of body.events) {
      // Basic validation
      if (
        !event.document_id ||
        !event.session_id ||
        event.timestamp === undefined ||
        !event.event_type ||
        event.position === undefined ||
        event.position < 0
      ) {
        console.error('Invalid event:', event);
        failedEvents.push(event.id || 'unknown');
        continue;
      }

      // Type-specific validation
      if (event.event_type === 'insert' && !event.content) {
        console.error('Insert event missing content:', event);
        failedEvents.push(event.id || 'unknown');
        continue;
      }

      if (event.event_type === 'delete' && !event.content_before) {
        console.error('Delete event missing content_before:', event);
        failedEvents.push(event.id || 'unknown');
        continue;
      }

      if (
        event.event_type === 'replace' &&
        (!event.content || !event.content_before)
      ) {
        console.error('Replace event missing content or content_before:', event);
        failedEvents.push(event.id || 'unknown');
        continue;
      }

      validEvents.push(event);
    }

    if (validEvents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid events to insert',
          inserted_count: 0,
          failed_events: failedEvents,
        } as EventBatchResponse,
        { status: 400 }
      );
    }

    // Insert events into database
    const { data, error } = await supabase
      .from('writing_events')
      .insert(validEvents)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to insert events',
          inserted_count: 0,
          failed_events: validEvents.map((e) => e.id || 'unknown'),
        } as EventBatchResponse,
        { status: 500 }
      );
    }

    const response: EventBatchResponse = {
      success: true,
      inserted_count: data.length,
      failed_events: failedEvents.length > 0 ? failedEvents : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        inserted_count: 0,
      } as EventBatchResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/[id]/events
 *
 * Fetch writing events for a document
 *
 * Query params:
 * - limit: number (default: 1000, max: 5000)
 * - offset: number (default: 0)
 * - since_timestamp: number (optional, fetch events after this timestamp)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check document access (owner or public)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id, is_public')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has access
    const hasAccess = document.user_id === user.id || document.is_public;
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this document' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '1000', 10),
      5000
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sinceTimestamp = searchParams.get('since_timestamp');

    // Build query
    let query = supabase
      .from('writing_events')
      .select('*')
      .eq('document_id', documentId)
      .order('timestamp', { ascending: true })
      .range(offset, offset + limit - 1);

    if (sinceTimestamp) {
      const timestamp = parseInt(sinceTimestamp, 10);
      if (!isNaN(timestamp)) {
        query = query.gt('timestamp', timestamp);
      }
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
