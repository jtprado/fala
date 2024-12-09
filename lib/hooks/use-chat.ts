"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from "@/lib/supabase/client";

type Session = Database['public']['Tables']['sessions']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // Fetch messages for current session
  useEffect(() => {
    if (!currentSessionId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('sequence_number', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
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

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${currentSessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${currentSessionId}`
      }, (payload) => {
        setMessages(current => {
          // Check if message already exists to prevent duplicates
          const exists = current.some(msg => msg.id === payload.new.id);
          if (exists) return current;
          return [...current, payload.new as Message];
        });
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

        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('last_accessed_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);
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
    type: string = 'text',
    feedback?: Message['feedback']
  ) => {
    if (!currentSessionId) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        router.push('/sign-in');
        return;
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

      await supabase
        .from('sessions')
        .update({
          last_message_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [currentSessionId, supabase, router, toast]);

  const createSession = useCallback(async (language?: string, level?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          language: language || 'en',
          level: level || 'beginner',
          title: 'New Chat Session',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSessions(prev => [session, ...prev]);
      setCurrentSessionId(session.id);
      
      // Navigate to new session
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
      const { error } = await supabase
        .from('sessions')
        .update({
          ...updates,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      // If archiving, redirect to home
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
