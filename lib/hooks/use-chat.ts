"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Message, Session, MessageType } from "@/lib/types";
import { sessionsDAL } from "@/lib/db/sessions";
import { messagesDAL } from "@/lib/db/messages";
import type { CreateMessageInput } from "@/lib/db/messages";
import { handleError, getUserFriendlyErrorMessage } from "@/lib/utils/error-handler";
import { useLoadingState } from "@/lib/hooks/use-loading-state";

type LoadingStates = {
  initialLoad: boolean;
  sendMessage: boolean;
  createSession: boolean;
  updateSession: boolean;
};

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const { isLoading, withLoading } = useLoadingState<LoadingStates>({
    initialLoad: true,
    sendMessage: false,
    createSession: false,
    updateSession: false
  });
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch messages for current session
  useEffect(() => {
    if (!currentSessionId) return;

    const fetchMessages = async () => {
      try {
        const messages = await messagesDAL.list(currentSessionId);
        setMessages(messages);
      } catch (error) {
        const appError = handleError(error);
        console.error('Error fetching messages:', appError);
        toast({
          title: "Error",
          description: getUserFriendlyErrorMessage(appError),
          variant: "destructive",
        });
      }
    };

    fetchMessages();

    // Subscribe to new messages and feedback changes
    const channel = supabase
      .channel(`messages:${currentSessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${currentSessionId}`
      }, () => {
        // Refetch messages to get latest with feedback
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId, supabase, toast]);

  // Fetch all sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const sessions = await sessionsDAL.list(user.id);
        setSessions(sessions);
      } catch (error) {
        const appError = handleError(error);
        console.error('Error fetching sessions:', appError);
        toast({
          title: "Error",
          description: getUserFriendlyErrorMessage(appError),
          variant: "destructive",
        });
      }
    };

    withLoading('initialLoad', fetchSessions);

    const channel = supabase
      .channel('sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions'
      }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, toast, withLoading]);

  const sendMessage = useCallback(async (
    content: string,
    type: MessageType = 'text',
    feedback?: CreateMessageInput['feedback']
  ) => {
    if (!currentSessionId) return;

    let tempMessageId: string | undefined;

    await withLoading('sendMessage', async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.push('/sign-in');
          return;
        }

        // Create optimistic message
        tempMessageId = crypto.randomUUID();
        const optimisticMessage: Message = {
          id: tempMessageId,
          session_id: currentSessionId,
          user_id: user.id,
          content,
          type,
          sequence_number: messages.length + 1,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMessage]);

        await messagesDAL.create(currentSessionId, user.id, {
          content,
          type,
          feedback
        });
      } catch (error) {
        const appError = handleError(error);
        console.error('Error sending message:', appError);
        toast({
          title: "Error",
          description: getUserFriendlyErrorMessage(appError),
          variant: "destructive",
        });
        // Revert optimistic update on error
        if (tempMessageId) {
          setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        }
      }
    });
  }, [currentSessionId, messages.length, supabase, router, toast, withLoading]);

  const createSession = useCallback(async (language?: Session['language'], level?: Session['level']) => {
    return withLoading('createSession', async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const session = await sessionsDAL.create(user.id, {
          language: language || 'en',
          level: level || 'beginner',
          title: 'New Chat Session',
          status: 'active'
        });

        setSessions(prev => [session, ...prev]);
        setCurrentSessionId(session.id);
        
        router.push(`/c/${session.id}`);
        return session.id;
      } catch (error) {
        const appError = handleError(error);
        console.error('Error creating session:', appError);
        toast({
          title: "Error",
          description: getUserFriendlyErrorMessage(appError),
          variant: "destructive",
        });
      }
    });
  }, [supabase, router, toast, withLoading]);

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<Session>
  ) => {
    return withLoading('updateSession', async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.push('/sign-in');
          return;
        }

        await sessionsDAL.update(sessionId, user.id, updates);
        
        if (updates.status === 'archived') {
          router.push('/');
        }
      } catch (error) {
        const appError = handleError(error);
        console.error('Error updating session:', appError);
        toast({
          title: "Error",
          description: getUserFriendlyErrorMessage(appError),
          variant: "destructive",
        });
      }
    });
  }, [supabase, router, toast, withLoading]);

  return {
    messages,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    sendMessage,
    createSession,
    updateSession,
    isLoading,
  };
}
