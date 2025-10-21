/**
 * Database Type Definitions
 *
 * These types represent the PostgreSQL database schema.
 *
 * NOTE: In production, these types should be auto-generated using:
 * `npx supabase gen types typescript --project-id <project-id> > types/supabase.ts`
 *
 * For now, we define them manually based on our migration files.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_public: boolean;
          status: 'draft' | 'published' | 'archived';
          visibility: 'private' | 'public' | 'unlisted';
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          last_edited_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          is_public?: boolean;
          status?: 'draft' | 'published' | 'archived';
          visibility?: 'private' | 'public' | 'unlisted';
          published_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_edited_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          is_public?: boolean;
          status?: 'draft' | 'published' | 'archived';
          visibility?: 'private' | 'public' | 'unlisted';
          published_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_edited_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      writing_events: {
        Row: {
          id: string;
          document_id: string;
          session_id: string;
          timestamp: number;
          event_type: 'insert' | 'delete' | 'replace';
          position: number;
          content: string | null;
          content_before: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          session_id: string;
          timestamp: number;
          event_type: 'insert' | 'delete' | 'replace';
          position: number;
          content?: string | null;
          content_before?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          session_id?: string;
          timestamp?: number;
          event_type?: 'insert' | 'delete' | 'replace';
          position?: number;
          content?: string | null;
          content_before?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'writing_events_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          }
        ];
      };
      checkpoints: {
        Row: {
          id: string;
          document_id: string;
          event_count: number;
          full_content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          event_count: number;
          full_content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          event_count?: number;
          full_content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'checkpoints_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type WritingEvent = Database['public']['Tables']['writing_events']['Row'];
export type Checkpoint = Database['public']['Tables']['checkpoints']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type WritingEventInsert =
  Database['public']['Tables']['writing_events']['Insert'];
export type CheckpointInsert =
  Database['public']['Tables']['checkpoints']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];
export type WritingEventUpdate =
  Database['public']['Tables']['writing_events']['Update'];
export type CheckpointUpdate =
  Database['public']['Tables']['checkpoints']['Update'];
