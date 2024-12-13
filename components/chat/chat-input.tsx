"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageType } from "@/lib/types";
import { SpeechControls } from "./speech-controls";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";

interface ChatInputProps {
  onSendMessage: (content: string, type: MessageType, feedback?: any) => void;
  isDisabled?: boolean;
  referenceText?: string;
  language?: string;
}

export function ChatInput({ 
  onSendMessage, 
  isDisabled,
  referenceText = "",
  language = "en"
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
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim(), "text");
      setMessage("");
    }
  }, [message, onSendMessage, isDisabled]);

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

  return (
    <div className="border-t p-4 bg-background">
      <div className="flex gap-2">
        <SpeechControls
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={handleStopRecording}
        />
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 min-h-[60px] max-h-[180px]"
          disabled={isDisabled || isRecording}
        />
        <Button 
          onClick={handleSend}
          disabled={!message.trim() || isDisabled || isRecording}
          className="self-end"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
