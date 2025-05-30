
"use client";

import type { Subtask } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (subtaskId: string) => void;
  onUpdate: (subtask: Subtask) => void;
  onDelete: (subtaskId: string) => void;
  isEditing?: boolean;
  className?: string; // Added className prop
}

export function SubtaskItem({ subtask, onToggle, onUpdate, onDelete, isEditing = true, className }: SubtaskItemProps) {
  const [title, setTitle] = useState(subtask.title);

  useEffect(() => {
    setTitle(subtask.title);
  }, [subtask.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title.trim() !== subtask.title && title.trim() !== "") { 
      onUpdate({ ...subtask, title: title.trim() });
    } else if (title.trim() === "" && subtask.title !== "") { 
        setTitle(subtask.title);
    }
  };
  
  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      (e.target as HTMLInputElement).blur(); 
    }
  };


  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <Checkbox
        id={`subtask-${subtask.id}-${isEditing ? 'edit' : 'view'}`} // Ensure unique ID for view/edit modes if rendered simultaneously
        checked={subtask.completed}
        onCheckedChange={() => onToggle(subtask.id)}
        aria-label={`Mark subtask ${subtask.title} as ${subtask.completed ? 'incomplete' : 'complete'}`}
        disabled={!isEditing} 
      />
      {isEditing ? (
        <Input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyPress={handleInputKeyPress}
          className={cn(
            "h-8 text-sm flex-grow border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1",
            subtask.completed ? "line-through text-muted-foreground" : ""
           )}
          placeholder="Subtask title"
        />
      ) : (
         <span className={cn(
            "text-sm flex-grow",
            subtask.completed ? "line-through text-muted-foreground" : ""
          )}
         >
          {subtask.title}
        </span>
      )}
      {isEditing && (
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:text-destructive shrink-0"
            onClick={() => onDelete(subtask.id)}
            aria-label="Delete subtask"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
