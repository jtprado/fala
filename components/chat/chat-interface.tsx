"use client";

import { useChat } from "@/lib/hooks/use-chat";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const {
    messages,
    sendMessage,
    isLoading,
    currentSessionId,
    updateSession
  } = useChat(sessionId);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ChatHeader 
        sessionId={sessionId} 
        onUpdateSession={updateSession}
      />
      <div className="flex-1 overflow-hidden">
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading}
        />
      </div>
      <ChatInput 
        onSendMessage={sendMessage} 
        isDisabled={!currentSessionId}
      />
    </div>
  );
}
