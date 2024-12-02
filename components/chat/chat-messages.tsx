"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useChat } from "@/lib/hooks/use-chat";

interface ChatMessagesProps {
  sessionId: string;
}

export function ChatMessages({ sessionId }: ChatMessagesProps) {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages } = useChat(sessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-4 ${
              message.user_id === user?.id ? "flex-row-reverse" : ""
            }`}
          >
            <Avatar />
            <div
              className={`rounded-lg p-4 ${
                message.user_id === user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p>{message.content}</p>
              {message.translation && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {message.translation}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}