'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { TextEditor } from '@/components/editor/TextEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [documentExists, setDocumentExists] = useState(false);
  const [documentTitle, setDocumentTitle] = useState<string>('Untitled Document');

  const checkDocumentExists = useCallback(async () => {
    try {
      // Try to fetch document metadata
      const response = await fetch(`/api/documents/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocumentTitle(data.document.title || 'Untitled Document');
        setDocumentExists(true);
      } else if (response.status === 404) {
        // Document doesn't exist
        setDocumentExists(false);
      } else {
        // Other error
        console.error('Error checking document:', response.statusText);
        setDocumentExists(false);
      }
    } catch (error) {
      console.error('Error checking document:', error);
      setDocumentExists(false);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && params.id) {
      checkDocumentExists();
    }
  }, [user, loading, router, params.id, checkDocumentExists]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading document...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!documentExists) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Not Found</h1>
          <p className="text-gray-600 mb-6">The document you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                ← Back to Dashboard
              </button>
              <div className="text-lg font-medium text-gray-900">
                Document {params.id.slice(0, 8)}...
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Auto-saved
              </span>
              <button
                onClick={() => router.push(`/documents/${params.id}/playback`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                View Playback
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Toolbar */}
      <EditorToolbar 
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
      />

      {/* Main Editor */}
      <main className="max-w-4xl mx-auto bg-white shadow-sm">
        <TextEditor
          documentId={params.id}
          placeholder="Continue writing your document..."
          maxLength={50000}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              Document ID: {params.id}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push(`/documents/${params.id}/playback`)}
                className="hover:text-gray-700"
              >
                Preview Timeline
              </button>
              <button
                onClick={() => router.push(`/read/${params.id}/diff`)}
                className="hover:text-gray-700"
              >
                View Changes
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}