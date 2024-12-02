"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/client";

type Session = Database['public']['Tables']['sessions']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch messages for current session
  useEffect(() => {
    if (!currentSessionId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${currentSessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${currentSessionId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [currentSessionId]);

  // Fetch all sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        // First check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          return;
        }

        if (!user) {
          console.log('No authenticated user');
          return;
        }

        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('last_accessed_at', { ascending: false });

        if (error) {
          console.error('Error fetching sessions:', error);
          return;
        }

        setSessions(data);
      } catch (error) {
        console.error('Error in fetchSessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();

    // Subscribe to session changes
    const sessionsSubscription = supabase
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
      sessionsSubscription.unsubscribe();
    };
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    type: string = 'text',
    feedback?: Message['feedback']
  ) => {
    if (!currentSessionId) return;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          session_id: currentSessionId,
          user_id: user.id,
          content,
          type,
          feedback
        });

      if (messageError) throw messageError;

      // Update session's last message timestamp
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          last_message_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (sessionError) throw sessionError;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [currentSessionId, toast]);

  const createSession = useCallback(async (language?: string, level?: string) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          language: language || 'en',
          level: level || 'beginner'
        })
        .select()
        .single();

      if (error) throw error;

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
  }, [router, toast]);

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<Session>
  ) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          ...updates,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update chat session",
        variant: "destructive",
      });
    }
  }, [toast]);

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
