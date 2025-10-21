'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { TextEditor } from '@/components/editor/TextEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';

export default function NewDocumentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(true);
  const [documentTitle, setDocumentTitle] = useState<string>('Untitled Document');

  const createNewDocument = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          is_public: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const data = await response.json();
      setDocumentId(data.document.id);
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating document:', error);
      // Fallback to client-side ID generation
      const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setDocumentId(newDocId);
      setIsCreating(false);
    }
  }, [user, documentTitle]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && !documentId) {
      createNewDocument();
    }
  }, [user, loading, router, documentId, createNewDocument]);

  if (loading || isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Creating new document...</div>
      </div>
    );
  }

  if (!user) {
    return null;
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
                New Document
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Auto-saved
              </span>
              <button
                onClick={() => router.push(`/documents/${documentId}/playback`)}
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
          documentId={documentId}
          placeholder="Start writing your document here..."
          maxLength={50000}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              Document ID: {documentId}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push(`/documents/${documentId}/playback`)}
                className="hover:text-gray-700"
              >
                Preview Timeline
              </button>
              <button
                onClick={() => router.push(`/read/${documentId}/diff`)}
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