"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@/lib/hooks/use-chat";

type Session = Database['public']['Tables']['sessions']['Row'];

interface ChatHeaderProps {
  sessionId: string;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
}

export function ChatHeader({ sessionId, onUpdateSession }: ChatHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const { createSession } = useChat();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/sign-in');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleArchiveChat = async () => {
    try {
      await onUpdateSession(sessionId, { status: 'archived' });
      router.push('/');
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive chat",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = async () => {
    try {
      // Create a new session with default values
      const newSessionId = await createSession('en', 'beginner');
      if (newSessionId) {
        router.refresh();
        router.push(`/c/${newSessionId}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b p-4 bg-background">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <h1 className="text-lg font-semibold">Language Learning Chat</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
          >
            New Chat
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchiveChat}>
                Archive Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
