import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Message, MessageType, MessageFeedback } from '@/lib/types';
import { z } from 'zod';

// Validation schemas
export const messageFeedbackSchema = z.object({
  pronunciation_score: z.number().min(0).max(100),
  accuracy_score: z.number().min(0).max(100),
  fluency_score: z.number().min(0).max(100),
  completeness_score: z.number().min(0).max(100)
});

export const messageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['text', 'audio', 'system'] as const),
  translation: z.string().optional(),
  feedback: messageFeedbackSchema.optional()
});

export type CreateMessageInput = z.infer<typeof messageSchema>;
export type CreateFeedbackInput = z.infer<typeof messageFeedbackSchema>;

export class MessagesDAL {
  private supabase = createClientComponentClient();

  async list(sessionId: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        *,
        message_feedback (
          pronunciation_score,
          accuracy_score,
          fluency_score,
          completeness_score
        )
      `)
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data as (Message & { message_feedback: MessageFeedback | null })[];
  }

  async create(sessionId: string, userId: string, input: CreateMessageInput) {
    // Validate input
    messageSchema.parse(input);

    const { data: message, error: messageError } = await this.supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: input.content,
        type: input.type,
        translation: input.translation
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // If feedback is provided, create feedback record
    if (input.feedback) {
      const { error: feedbackError } = await this.supabase
        .from('message_feedback')
        .insert({
          message_id: message.id,
          ...input.feedback
        });

      if (feedbackError) throw feedbackError;
    }

    // Update session last_message_at
    const { error: sessionError } = await this.supabase
      .from('sessions')
      .update({
        last_message_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (sessionError) throw sessionError;

    return message as Message;
  }

  async addFeedback(messageId: string, feedback: CreateFeedbackInput) {
    // Validate feedback
    messageFeedbackSchema.parse(feedback);

    const { error } = await this.supabase
      .from('message_feedback')
      .insert({
        message_id: messageId,
        ...feedback
      });

    if (error) throw error;
  }

  async updateFeedback(messageId: string, feedback: Partial<CreateFeedbackInput>) {
    // Validate partial feedback
    if (Object.keys(feedback).length > 0) {
      messageFeedbackSchema.partial().parse(feedback);
    }

    const { error } = await this.supabase
      .from('message_feedback')
      .update(feedback)
      .eq('message_id', messageId);

    if (error) throw error;
  }
}

// Export singleton instance
export const messagesDAL = new MessagesDAL();
