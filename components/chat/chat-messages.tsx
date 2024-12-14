"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { Message, MessageFeedback } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreDisplay } from "./score-display";

interface ChatMessagesProps {
  messages: (Message & {
    message_feedback?: MessageFeedback | null;
  })[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keyboard navigation for messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PageUp') {
        e.preventDefault();
        container.scrollTop -= container.clientHeight;
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        container.scrollTop += container.clientHeight;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner text="Loading messages..." size="lg" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No messages yet"
        description="Start a conversation to begin practicing!"
        className="flex-1"
      />
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 focus:outline-none"
      tabIndex={0}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message, index) => {
        const isUser = message.user_id !== 'assistant';
        const isSystem = message.type === 'system';
        const feedback = message.message_feedback;
        const showFeedback = feedback && message.type === 'audio';

        return (
          <div
            key={message.id}
            className={cn(
              "flex",
              isSystem ? "justify-center" : isUser ? "justify-end" : "justify-start"
            )}
            role="article"
            aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-4 shadow-sm transition-colors",
                isSystem 
                  ? "bg-muted text-muted-foreground" 
                  : isUser
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary/50 text-secondary-foreground",
                !isSystem && "hover:shadow-md"
              )}
            >
              <p 
                className="text-sm whitespace-pre-wrap break-words"
                role="textbox"
                aria-readonly="true"
              >
                {message.content}
              </p>
              
              {message.translation && (
                <p 
                  className="text-xs opacity-75 mt-1 italic"
                  role="textbox"
                  aria-label="Translation"
                  aria-readonly="true"
                >
                  {message.translation}
                </p>
              )}

              {showFeedback && (
                <div 
                  className="mt-4"
                  role="region"
                  aria-label="Pronunciation feedback"
                >
                  <ScoreDisplay feedback={{
                    pronunciation_score: feedback.pronunciation_score,
                    accuracy_score: feedback.accuracy_score,
                    fluency_score: feedback.fluency_score,
                    completeness_score: feedback.completeness_score
                  }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div 
        ref={messagesEndRef}
        aria-hidden="true"
      />
    </div>
  );
}
