"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageType } from "@/lib/supabase/client";

interface ChatInputProps {
  onSendMessage: (content: string, type: string) => void;
  isDisabled?: boolean;
}

export function ChatInput({ onSendMessage, isDisabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = useCallback(() => {
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim(), MessageType.TEXT);
      setMessage("");
    }
  }, [message, onSendMessage, isDisabled]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="border-t p-4 bg-background">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 min-h-[60px] max-h-[180px]"
          disabled={isDisabled}
        />
        <Button 
          onClick={handleSend}
          disabled={!message.trim() || isDisabled}
          className="self-end"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
