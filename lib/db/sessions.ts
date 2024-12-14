import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session, SessionLanguage, SessionLevel, SessionStatus } from '@/lib/types';
import { z } from 'zod';

// Validation schemas
export const sessionSchema = z.object({
  language: z.enum(['en', 'es', 'fr', 'de'] as const),
  level: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  title: z.string().min(1),
  status: z.enum(['active', 'archived', 'deleted'] as const)
});

export type CreateSessionInput = z.infer<typeof sessionSchema>;

export interface SessionStats {
  session_count: number;
  last_activity: string;
  languages_used: number;
  levels_used: number;
}

export interface MessageSearchResult {
  id: string;
  session_id: string;
  content: string;
  rank: number;
}

export class SessionsDAL {
  private supabase = createClientComponentClient();

  async list(userId: string, includeArchived = false) {
    // Use the active_sessions view for better performance when not including archived
    const query = !includeArchived
      ? this.supabase.from('active_sessions')
      : this.supabase.from('sessions');

    const { data, error } = await query
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) throw error;
    return data as Session[];
  }

  async create(userId: string, input: CreateSessionInput) {
    // Validate input
    sessionSchema.parse(input);

    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        user_id: userId,
        ...input
      })
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  }

  async update(sessionId: string, userId: string, updates: Partial<CreateSessionInput>) {
    // Validate partial input
    if (Object.keys(updates).length > 0) {
      sessionSchema.partial().parse(updates);
    }

    const { error } = await this.supabase
      .from('sessions')
      .update({
        ...updates,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async updateLastAccessed(sessionId: string, userId: string) {
    const { error } = await this.supabase
      .from('sessions')
      .update({
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async get(sessionId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as Session;
  }

  async archive(sessionId: string, userId: string) {
    return this.update(sessionId, userId, { status: 'archived' });
  }

  async delete(sessionId: string, userId: string) {
    return this.update(sessionId, userId, { status: 'deleted' });
  }

  async getStats(userId: string): Promise<SessionStats> {
    // Use materialized view for efficient stats retrieval
    const { data, error } = await this.supabase
      .from('session_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data as SessionStats;
  }

  async archiveOldSessions(userId: string, daysThreshold: number) {
    // Use stored procedure for efficient batch archiving
    const { data, error } = await this.supabase
      .rpc('archive_old_sessions', { days_threshold: daysThreshold });

    if (error) throw error;
    return data as number; // Returns number of archived sessions
  }

  async searchMessages(
    userId: string, 
    query: string, 
    sessionId?: string
  ): Promise<MessageSearchResult[]> {
    // Use full-text search function
    const { data, error } = await this.supabase
      .rpc('search_messages', { 
        search_query: query,
        session_id_param: sessionId,
        user_id_param: userId
      });

    if (error) throw error;
    return data as MessageSearchResult[];
  }

  async getSessionCountByStatus(userId: string): Promise<Record<SessionStatus, number>> {
    // Use materialized view for efficient counting
    const { data, error } = await this.supabase
      .from('session_stats')
      .select('status, session_count')
      .eq('user_id', userId);

    if (error) throw error;

    // Transform array to record
    return (data || []).reduce((acc, { status, session_count }) => ({
      ...acc,
      [status]: session_count
    }), {
      active: 0,
      archived: 0,
      deleted: 0
    } as Record<SessionStatus, number>);
  }
}

// Export singleton instance
export const sessionsDAL = new SessionsDAL();
