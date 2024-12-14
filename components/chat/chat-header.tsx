"use client";

import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { Archive, Globe, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  session: Session;
  onArchive?: () => void;
  className?: string;
}

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
};

const levelNames: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ChatHeader({ session, onArchive, className }: ChatHeaderProps) {
  return (
    <header 
      className={cn(
        "flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      role="banner"
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 
            className="text-lg font-semibold leading-none tracking-tight"
            aria-label={`Chat session: ${session.title}`}
          >
            {session.title}
          </h1>
          <div 
            className="flex items-center gap-2 mt-1"
            aria-label={`Language: ${languageNames[session.language]}, Level: ${levelNames[session.level]}`}
          >
            <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              {languageNames[session.language]} · {levelNames[session.level]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Session settings"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onArchive && (
              <DropdownMenuItem
                onClick={onArchive}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="h-4 w-4 mr-2" aria-hidden="true" />
                Archive Session
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
