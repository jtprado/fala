"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChat } from "@/lib/hooks/use-chat";

export function WelcomeScreen() {
  const { createSession } = useChat();

  const handleNewChat = () => {
    createSession();
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">Welcome to Language Learning Chat</h2>
        <Button onClick={handleNewChat} className="gap-2">
          <Plus className="h-4 w-4" />
          Start New Chat
        </Button>
      </div>
    </div>
  );
}
