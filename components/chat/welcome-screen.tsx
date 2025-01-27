"use client";

import { useChat } from "@/lib/hooks/use-chat";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
};

const LEVELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function WelcomeScreen() {
  const { createSession } = useChat();
  const [language, setLanguage] = useState<'en' | 'es' | 'fr' | 'de'>('en');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      const sessionId = await createSession(language, level);
      if (sessionId) {
        // Force a router refresh to ensure new session is recognized
        router.refresh();
        // Navigate to the new chat session
        router.push(`/c/${sessionId}`);
      }
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">
            Welcome to Language Learning Chat
          </h1>
          <p className="text-muted-foreground">
            Select your target language and proficiency level to begin
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select value={language} onValueChange={(value) =>
              setLanguage(value as 'en' | 'es' | 'fr' | 'de')}>
              {Object.entries(LANGUAGES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Level</label>
            <Select value={level} onValueChange={(value) =>
              setLevel(value as 'beginner' | 'intermediate' | 'advanced')}>
              {Object.entries(LEVELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleStartChat}
            disabled={isLoading}
          >
            {isLoading ? "Creating chat..." : "Start Learning"}
          </Button>
        </div>
      </div>
    </div>
  );
}
