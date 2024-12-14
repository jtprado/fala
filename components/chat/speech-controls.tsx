"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeechControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function SpeechControls({
  isRecording,
  onStartRecording,
  onStopRecording,
  disabled,
  className,
  "aria-label": ariaLabel,
}: SpeechControlsProps) {
  return (
    <Button
      variant={isRecording ? "destructive" : "secondary"}
      size="icon"
      onClick={isRecording ? onStopRecording : onStartRecording}
      disabled={disabled}
      className={cn(
        "transition-colors",
        isRecording && "animate-pulse",
        className
      )}
      aria-label={ariaLabel || (isRecording ? "Stop recording" : "Start recording")}
      aria-pressed={isRecording}
    >
      {isRecording ? (
        <MicOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Mic className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">
        {isRecording ? "Stop recording" : "Start recording"}
      </span>
    </Button>
  );
}
