"use client";

import { useChat } from "@/lib/hooks/use-chat";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  sessionId?: string;
  className?: string;
}

export function ChatInterface({ sessionId, className }: ChatInterfaceProps) {
  const {
    messages,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    sendMessage,
    createSession,
    updateSession,
    isLoading,
  } = useChat(sessionId);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Check loading states using the isLoading function
  const isInitialLoading = isLoading('initialLoad');
  const isCreatingSession = isLoading('createSession');
  const isSendingMessage = isLoading('sendMessage');

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading chat..." />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "grid h-screen",
        "grid-cols-[280px_1fr]", // Default layout with sidebar
        "lg:grid-cols-[320px_1fr]", // Wider sidebar on larger screens
        className
      )}
      role="main"
    >
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId || undefined}
        onSessionSelect={setCurrentSessionId}
        onNewSession={createSession}
        isLoading={isCreatingSession}
        className="hidden md:flex" // Hide sidebar on mobile
      />

      <div 
        className="flex flex-col h-screen"
        role="region"
        aria-label="Chat area"
      >
        {currentSession && (
          <>
            <ChatHeader
              session={currentSession}
              onArchive={() => updateSession(currentSession.id, { status: 'archived' })}
            />
            <ChatMessages
              messages={messages}
              isLoading={isInitialLoading}
            />
            <ChatInput
              onSendMessage={sendMessage}
              isDisabled={!currentSession || currentSession.status === 'archived'}
              isLoading={isSendingMessage}
              referenceText=""
              language={currentSession.language}
            />
          </>
        )}
      </div>
    </div>
  );
}
