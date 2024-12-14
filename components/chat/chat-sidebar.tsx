"use client";

import { Session } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MessageSquarePlus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  sessions: Session[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  isLoading,
  className
}: ChatSidebarProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <LoadingSpinner text="Loading sessions..." />
      </div>
    );
  }

  return (
    <aside 
      className={cn("flex flex-col border-r bg-background", className)}
      role="complementary"
      aria-label="Chat sessions"
    >
      <div className="p-4 border-b">
        <Button 
          onClick={onNewSession} 
          className="w-full justify-start"
          aria-label="Start new chat session"
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden="true" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {sessions.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No sessions yet"
            description="Start a new chat to begin practicing!"
            className="p-4"
          />
        ) : (
          <div 
            className="space-y-2 p-4"
            role="list"
            aria-label="Chat sessions list"
          >
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isArchived = session.status === 'archived';

              return (
                <Button
                  key={session.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isArchived && "opacity-50",
                    isActive && "bg-secondary"
                  )}
                  onClick={() => onSessionSelect(session.id)}
                  role="listitem"
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`${session.title}${isArchived ? ' (Archived)' : ''}`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="line-clamp-1">{session.title}</span>
                    <span 
                      className="text-xs text-muted-foreground"
                      aria-label={`Last active ${new Date(session.last_accessed_at).toLocaleDateString()}`}
                    >
                      {new Date(session.last_accessed_at).toLocaleDateString()}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
