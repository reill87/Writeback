'use client';

import { useParams } from 'next/navigation';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { ViewModeToggle } from '@/components/reader/ViewModeToggle';
import { useDiff } from '@/hooks/useDiff';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingButton } from '@/components/ui/LoadingSpinner';

export default function DiffPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const {
    firstVersion,
    finalVersion,
    diffResult,
    loading,
    error,
    refresh,
  } = useDiff({
    documentId,
    autoFetch: true,
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Writing Timeline Platform
            </h1>
            <a
              href="/documents"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              My Documents
            </a>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* View Mode Toggle */}
        <div className="mb-8">
          <ViewModeToggle documentId={documentId} />
        </div>
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Document Comparison
          </h1>
          <p className="text-gray-600">
            Compare the first draft with the final version to see how the document evolved.
          </p>
          
          {/* Refresh Button */}
          <div className="mt-4">
            <LoadingButton
              onClick={refresh}
              loading={loading}
              className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            >
              Refresh
            </LoadingButton>
          </div>
        </div>
        
        {/* Diff Viewer */}
        <ErrorBoundary>
          <DiffViewer
            firstVersion={firstVersion}
            finalVersion={finalVersion}
            diffResult={diffResult}
            loading={loading}
            error={error}
            className="mb-8"
          />
        </ErrorBoundary>
        
        {/* Help Text */}
        {!loading && !error && diffResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">
              How to read this comparison
            </h3>
            <div className="text-blue-800 text-sm space-y-2">
              <p>
                <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                <strong>Red highlighting</strong> shows text that was removed from the first draft.
              </p>
              <p>
                <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
                <strong>Green highlighting</strong> shows text that was added to create the final version.
              </p>
              <p>
                <span className="inline-block w-3 h-3 bg-gray-300 rounded mr-2"></span>
                <strong>No highlighting</strong> shows text that remained unchanged between versions.
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>Writing Timeline Platform - 작가의 창작 과정을 투명하게 공유하는 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}