import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Document } from '@/types/supabase';

/**
 * Document API Client
 */
const documentsApi = {
  /**
   * List documents
   */
  async list(params?: { limit?: number; offset?: number }): Promise<Document[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const response = await fetch(`/api/documents?${query.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    const data = await response.json();
    return data.documents;
  },

  /**
   * Create a new document
   */
  async create(data: {
    title: string;
    status?: 'draft' | 'published' | 'archived';
    visibility?: 'private' | 'public' | 'unlisted';
    metadata?: Record<string, unknown>;
  }): Promise<Document> {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create document');
    }

    const result = await response.json();
    return result.document;
  },
};

/**
 * Query Keys
 */
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    [...documentKeys.lists(), params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
  events: (id: string) => [...documentKeys.all, 'events', id] as const,
};

/**
 * Hook: List documents
 *
 * Fetches the user's documents with optional pagination.
 */
export function useDocuments(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsApi.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook: Create document
 *
 * Creates a new document and invalidates the documents list.
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: (newDocument) => {
      // Invalidate documents list to refetch
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      // Optionally, add to cache optimistically
      queryClient.setQueryData(
        documentKeys.list(),
        (old: Document[] | undefined) => {
          return old ? [newDocument, ...old] : [newDocument];
        }
      );
    },
  });
}

/**
 * Hook: Get document by ID
 *
 * Note: This is a placeholder - in real implementation, we'd fetch from API
 * For now, we extract from the documents list cache
 */
export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      // In production, fetch from /api/documents/[id]
      // For MVP, we'll extract from list cache
      const response = await fetch(`/api/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      const doc = data.documents.find((d: Document) => d.id === id);
      if (!doc) throw new Error('Document not found');
      return doc;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
