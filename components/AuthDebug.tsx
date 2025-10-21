'use client';

import { useAuth } from '@/lib/auth/AuthProvider';

export default function AuthDebug() {
  const { user, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 bg-black text-white p-3 rounded text-xs z-50 max-w-xs"
      style={{ fontFamily: 'monospace' }}
    >
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>ID: {user?.id || 'null'}</div>
    </div>
  );
}