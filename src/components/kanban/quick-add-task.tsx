
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useKanban } from "@/lib/store";
import type { Task } from "@/lib/types";
import { DEFAULT_COLUMNS } from "@/lib/constants";

export function QuickAddTask() {
  const { dispatch } = useKanban();
  const [title, setTitle] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      columnId: DEFAULT_COLUMNS[0].id, // Add to "To Do" column by default
      priority: "medium",
      tags: [],
      subtasks: [],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // Timer defaults
      timerActive: false,
      timeSpentSeconds: 0,
      timerStartTime: null,
    };

    dispatch({ type: "ADD_TASK", payload: newTask });
    setTitle("");
  };

  return (
    // The parent QuickActionsBar will provide the background and shadow
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <Input
        type="text"
        placeholder="Enter a title for your new task & press Enter..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-grow h-10 sm:h-11 text-base bg-background/70 dark:bg-input" // Adjusted background for input
      />
      <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11" aria-label="Add task">
        <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </form>
  );
}
