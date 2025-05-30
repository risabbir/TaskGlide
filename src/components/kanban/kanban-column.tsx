
"use client";

import type { Column, Task } from "@/lib/types";
import { TaskCard } from "./task-card";
import React from "react"; // Required for React.createElement
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  allColumns: Column[]; // For move functionality
}

export function KanbanColumn({ column, tasks, allColumns }: KanbanColumnProps) {
  const ColumnIcon = column.icon;

  return (
    <div className="flex flex-col w-full md:w-80 lg:w-96 shrink-0 bg-secondary/50 rounded-lg shadow-sm h-full">
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-secondary/80 backdrop-blur-sm z-10 rounded-t-lg">
        <div className="flex items-center gap-2">
          {ColumnIcon && <ColumnIcon className="h-5 w-5 text-primary" />}
          <h2 className="font-semibold text-base">{column.title}</h2>
        </div>
        <span className="text-sm font-medium px-2 py-0.5 bg-primary/20 text-primary rounded-full">
          {tasks.length}
        </span>
      </div>
      <ScrollArea className="flex-grow p-4 overflow-y-auto h-[calc(100vh-200px)] md:h-[calc(100vh-240px)]">
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks in this column.</p>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} columns={allColumns} />
        ))}
      </ScrollArea>
    </div>
  );
}
