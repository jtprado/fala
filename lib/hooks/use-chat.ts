"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Message, Session, MessageType } from "@/lib/types";
import { sessionsDAL } from "@/lib/db/sessions";
import { messagesDAL } from "@/lib/db/messages";
import type { CreateMessageInput } from "@/lib/db/messages";

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isLoading, setIsLoading] = useState(true);
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
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
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
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();

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
  }, [supabase, router, toast]);

  const sendMessage = useCallback(async (
    content: string,
    type: MessageType = 'text',
    feedback?: CreateMessageInput['feedback']
  ) => {
    if (!currentSessionId) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        router.push('/sign-in');
        return;
      }

      await messagesDAL.create(currentSessionId, user.id, {
        content,
        type,
        feedback
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [currentSessionId, supabase, router, toast]);

  const createSession = useCallback(async (language?: Session['language'], level?: Session['level']) => {
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
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
    }
  }, [supabase, router, toast]);

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<Session>
  ) => {
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
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update chat session",
        variant: "destructive",
      });
    }
  }, [supabase, router, toast]);

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
