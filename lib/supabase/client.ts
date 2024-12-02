import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          last_message_at: string;
          last_accessed_at: string;
          status: string;
          language: string;
          level: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          status: string;
          language: string;
          level: string;
        };
        Update: Partial<{
          user_id: string;
          title: string;
          last_message_at: string;
          last_accessed_at: string;
          status: string;
          language: string;
          level: string;
        }>;
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          content: string;
          type: string;
          translation?: string;
          feedback?: {
            pronunciation: number;
            accuracy: number;
            fluency: number;
            completeness: number;
          };
          sequence_number: number;
          created_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          content: string;
          type: string;
          translation?: string;
          feedback?: {
            pronunciation: number;
            accuracy: number;
            fluency: number;
            completeness: number;
          };
        };
        Update: Partial<{
          session_id: string;
          user_id: string;
          content: string;
          type: string;
          translation?: string;
          feedback?: {
            pronunciation: number;
            accuracy: number;
            fluency: number;
            completeness: number;
          };
          sequence_number: number;
        }>;
      };
    };
  };
};
