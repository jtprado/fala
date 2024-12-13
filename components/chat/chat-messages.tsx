"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { ScoreDisplay } from "./score-display";

interface ChatMessagesProps {
  messages: (Message & {
    message_feedback?: {
      pronunciation_score: number;
      accuracy_score: number;
      fluency_score: number;
      completeness_score: number;
    } | null;
  })[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.type === 'system' 
              ? 'justify-center' 
              : message.user_id === 'assistant' 
                ? 'justify-start' 
                : 'justify-end'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 ${
              message.type === 'system'
                ? 'bg-muted text-muted-foreground'
                : message.user_id === 'assistant'
                ? 'bg-primary/10 text-primary-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.translation && (
              <p className="text-xs opacity-75 mt-1">
                {message.translation}
              </p>
            )}
            {message.message_feedback && (
              <div className="mt-4">
                <ScoreDisplay feedback={message.message_feedback} />
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
