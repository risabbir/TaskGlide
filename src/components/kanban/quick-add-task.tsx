
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
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-muted/50 rounded-lg shadow">
      <Input
        type="text"
        placeholder="Add a new task and press Enter..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit" size="icon" aria-label="Add task">
        <PlusCircle className="h-5 w-5" />
      </Button>
    </form>
  );
}
