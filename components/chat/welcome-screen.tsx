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
} as const;

const LEVELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

export function WelcomeScreen() {
  const { createSession } = useChat();
  const [language, setLanguage] = useState<keyof typeof LANGUAGES>("en");
  const [level, setLevel] = useState<keyof typeof LEVELS>("beginner");
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
            <Select
              value={language}
              onValueChange={(value: keyof typeof LANGUAGES) => setLanguage(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Level</label>
            <Select
              value={level}
              onValueChange={(value: keyof typeof LEVELS) => setLevel(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEVELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
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
