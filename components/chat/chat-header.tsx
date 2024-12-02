"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Save } from "lucide-react";
import { Database } from "@/lib/supabase/client";

type Session = Database['public']['Tables']['sessions']['Row'];

interface ChatHeaderProps {
  session: Session;
  onUpdate: (updates: { title?: string; language?: string; level?: string }) => Promise<void>;
}

export function ChatHeader({ session, onUpdate }: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(session.title);

  const handleSave = async () => {
    await onUpdate({ title });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-[200px]"
            />
            <Button size="icon" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Select
          value={session.language}
          onValueChange={(value) => onUpdate({ language: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={session.level}
          onValueChange={(value) => onUpdate({ level: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}