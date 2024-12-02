"use client";

import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/supabase/client";

type Session = Database['public']['Tables']['sessions']['Row'];

interface ChatSidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="p-4">
        <Button className="w-full gap-2" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {sessions.map((session) => (
            <Button
              key={session.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                currentSessionId === session.id && "bg-muted"
              )}
              onClick={() => onSessionSelect(session.id)}
            >
              <MessageSquare className="h-4 w-4" />
              <div className="flex flex-1 flex-col items-start text-sm">
                <span className="font-medium">
                  {session.title || "Chat Session"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(session.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}