"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { WelcomeScreen } from "./welcome-screen";
import { useChat } from "@/lib/hooks/use-chat";
import { Database } from "@/lib/supabase/client";

export function ChatInterface() {
  const supabase = createClientComponentClient<Database>();
  const { sessions, currentSessionId, setCurrentSessionId, createSession } = useChat();

  if (!sessions) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={setCurrentSessionId}
        onNewChat={createSession}
      />
      <div className="flex flex-1 flex-col">
        {currentSessionId ? (
          <>
            <ChatMessages sessionId={currentSessionId} />
            <ChatInput sessionId={currentSessionId} />
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}
