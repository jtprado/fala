"use client";

import { useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { SpeechControls } from "./speech-controls";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { ScoreDisplay } from "./score-display";
import { Database } from "@/lib/supabase/client";

interface ChatInputProps {
  sessionId: string;
  currentPhrase?: string;
  language?: string;
}

export function ChatInput({ sessionId, currentPhrase, language = "en-US" }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showScores, setShowScores] = useState(false);
  const [scores, setScores] = useState<any>(null);
  
  const supabase = createClientComponentClient<Database>();

  const sendMessage = async (content: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          content,
          type: 'text'
        });

      if (error) throw error;
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const {
    isRecording,
    startRecording,
    stopRecording,
    results,
  } = useSpeechRecognition(language, currentPhrase || "");

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleStopRecording = useCallback(() => {
    stopRecording();
    if (results.length > 0) {
      const latestResult = results[results.length - 1];
      if (latestResult.NBest && latestResult.NBest.length > 0) {
        const scores = {
          accuracyScore: latestResult.NBest[0].PronunciationAssessment.AccuracyScore,
          fluencyScore: latestResult.NBest[0].PronunciationAssessment.FluencyScore,
          completenessScore: latestResult.NBest[0].PronunciationAssessment.CompletenessScore,
          prosodyScore: latestResult.NBest[0].PronunciationAssessment.ProsodyScore,
          pronunciationScore: latestResult.NBest[0].PronunciationAssessment.PronScore,
        };
        setScores(scores);
        setShowScores(true);
      }
    }
  }, [results, stopRecording]);

  return (
    <div className="border-t p-4 space-y-4">
      {showScores && scores && (
        <ScoreDisplay scores={scores} />
      )}
      <div className="flex gap-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          className="min-h-[60px]"
        />
        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
          <SpeechControls
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
          />
        </div>
      </div>
    </div>
  );
}
