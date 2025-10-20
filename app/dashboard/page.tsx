'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Writing Platform
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your documents and writing projects</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/documents/new"
            className="bg-blue-600 text-white p-6 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            <div className="text-2xl mb-2">✍️</div>
            <h3 className="text-lg font-semibold mb-1">New Document</h3>
            <p className="text-blue-100">Start writing a new document</p>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="text-lg font-semibold mb-1">My Documents</h3>
            <p className="text-gray-600">View and manage your documents</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-semibold mb-1">Analytics</h3>
            <p className="text-gray-600">Track your writing progress</p>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg mb-2">No documents yet</p>
              <p className="text-sm">Create your first document to get started</p>
              <Link
                href="/documents/new"
                className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Document
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}