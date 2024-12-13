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

export class SessionsDAL {
  private supabase = createClientComponentClient();

  async list(userId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
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
}

// Export singleton instance
export const sessionsDAL = new SessionsDAL();
