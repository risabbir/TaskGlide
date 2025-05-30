
"use client";

import type { Subtask } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (subtaskId: string) => void;
  onUpdate: (subtask: Subtask) => void;
  onDelete: (subtaskId: string) => void;
  isEditing?: boolean;
}

export function SubtaskItem({ subtask, onToggle, onUpdate, onDelete, isEditing = true }: SubtaskItemProps) {
  const [title, setTitle] = useState(subtask.title);

  useEffect(() => {
    setTitle(subtask.title);
  }, [subtask.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title.trim() !== subtask.title) {
      onUpdate({ ...subtask, title: title.trim() });
    }
  };
  
  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      (e.target as HTMLInputElement).blur(); // Remove focus
    }
  };


  return (
    <div className="flex items-center gap-2 py-1 group">
      <Checkbox
        id={`subtask-${subtask.id}`}
        checked={subtask.completed}
        onCheckedChange={() => onToggle(subtask.id)}
        aria-label={`Mark subtask ${subtask.title} as ${subtask.completed ? 'incomplete' : 'complete'}`}
      />
      {isEditing ? (
        <Input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyPress={handleInputKeyPress}
          className={`h-8 text-sm flex-grow ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
          placeholder="Subtask title"
        />
      ) : (
         <span className={`text-sm flex-grow ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
          {subtask.title}
        </span>
      )}
      {isEditing && (
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:text-destructive"
            onClick={() => onDelete(subtask.id)}
            aria-label="Delete subtask"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
