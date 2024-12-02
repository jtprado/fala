"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useChat } from "@/lib/hooks/use-chat";

export default function ChatSession() {
  const { sessionId } = useParams();
  const { setCurrentSessionId } = useChat();

  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId as string);
    }
  }, [sessionId, setCurrentSessionId]);

  return <ChatInterface />;
}