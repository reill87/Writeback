import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DocumentHeader } from '@/components/reader/DocumentHeader';
import { DocumentContent } from '@/components/reader/DocumentContent';
import { ViewModeToggle } from '@/components/reader/ViewModeToggle';
import { EventSourcingEngine } from '@/lib/event-sourcing/engine';
import type { Document, Profile, WritingEvent } from '@/types/supabase';

interface ReadPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Reader Page
 *
 * Public page for reading published documents.
 *
 * Features:
 * - Fetches public document by ID
 * - Displays document header, content, and view mode toggle
 * - Reconstructs final content from events via event sourcing
 * - No authentication required for public documents
 */
export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch document (public or owned by user)
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (docError || !document) {
    notFound();
  }

  // Check if document is public or user has access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasAccess = document.visibility === 'public' || document.user_id === user?.id;

  if (!hasAccess) {
    notFound();
  }

  // Fetch author profile
  const { data: author } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', document.user_id)
    .single();

  // Fetch writing events to reconstruct content
  const { data: events } = await supabase
    .from('writing_events')
    .select('*')
    .eq('document_id', id)
    .order('timestamp', { ascending: true });

  // Reconstruct final content from events
  let finalContent = '';
  let eventCount = 0;
  let writingDuration: string | undefined;

  if (events && events.length > 0) {
    const replayResult = EventSourcingEngine.replay(events as WritingEvent[]);
    finalContent = replayResult.content;
    eventCount = events.length;

    // Calculate writing duration
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const durationMs = lastEvent.timestamp - firstEvent.timestamp;
    const durationMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0) {
      writingDuration = `${hours}h ${minutes}m`;
    } else {
      writingDuration = `${minutes}m`;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Writing Timeline Platform
            </h1>
            {user && (
              <a
                href="/documents"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                My Documents
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* View Mode Toggle */}
        <div className="mb-8">
          <ViewModeToggle documentId={id} />
        </div>

        {/* Document Header */}
        <DocumentHeader
          document={document as Document}
          author={author as Profile}
          eventCount={eventCount}
          writingDuration={writingDuration}
        />

        {/* Document Content */}
        <DocumentContent content={finalContent} />
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>Writing Timeline Platform - 작가의 창작 과정을 투명하게 공유하는 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Metadata for SEO
 */
export async function generateMetadata({ params }: ReadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: document } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .eq('visibility', 'public')
    .single();

  return {
    title: document?.title || 'Document',
    description: `Read "${document?.title}" on Writing Timeline Platform`,
  };
}
