"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface SpeechControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function SpeechControls({
  isRecording,
  onStartRecording,
  onStopRecording,
}: SpeechControlsProps) {
  return (
    <Button
      variant={isRecording ? "destructive" : "secondary"}
      size="icon"
      onClick={isRecording ? onStopRecording : onStartRecording}
    >
      {isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}