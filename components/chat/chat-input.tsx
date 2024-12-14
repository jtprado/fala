"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageType } from "@/lib/types";
import { SpeechControls } from "./speech-controls";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string, type: MessageType, feedback?: any) => void;
  isDisabled?: boolean;
  referenceText?: string;
  language?: string;
  isLoading?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  isDisabled,
  referenceText = "",
  language = "en",
  isLoading = false
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { 
    isRecording, 
    error, 
    startRecording, 
    stopRecording,
    getFeedback
  } = useSpeechRecognition(language, referenceText);

  const handleSend = useCallback(() => {
    if (message.trim() && !isDisabled && !isLoading) {
      onSendMessage(message.trim(), "text");
      setMessage("");
    }
  }, [message, onSendMessage, isDisabled, isLoading]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    const feedback = getFeedback();
    if (feedback) {
      onSendMessage("🎤 Audio message", "audio", feedback);
    }
  }, [stopRecording, getFeedback, onSendMessage]);

  if (error) {
    console.error("Speech recognition error:", error);
  }

  const disabled = isDisabled || isLoading || isRecording;

  return (
    <div 
      className="border-t p-4 bg-background"
      role="form"
      aria-label="Message input"
    >
      <div className="flex gap-2">
        <SpeechControls
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={handleStopRecording}
          disabled={isDisabled || isLoading}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        />
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className={cn(
            "flex-1 min-h-[60px] max-h-[180px] resize-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
          aria-label="Message input"
          aria-disabled={disabled}
        />
        <Button 
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="self-end"
          aria-label="Send message"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            "Send"
          )}
        </Button>
      </div>
      {error && (
        <p 
          className="text-sm text-destructive mt-2"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
