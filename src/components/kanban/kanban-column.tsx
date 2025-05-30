
"use client";

import type { Column, Task } from "@/lib/types";
import { TaskCard } from "./task-card";
import React from "react"; 
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  allColumns: Column[]; 
}

export function KanbanColumn({ column, tasks, allColumns }: KanbanColumnProps) {
  const ColumnIcon = column.icon;

  return (
    <div className="flex flex-col w-full sm:w-72 md:w-80 lg:w-[350px] shrink-0 bg-secondary/50 dark:bg-secondary/60 rounded-lg shadow-sm h-full">
      <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-secondary/90 dark:bg-secondary backdrop-blur-sm z-10 rounded-t-lg">
        <div className="flex items-center gap-2 min-w-0">
          {ColumnIcon && <ColumnIcon className="h-5 w-5 text-primary shrink-0" />}
          <h2 className="font-semibold text-base break-words truncate">{column.title}</h2>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 bg-primary/20 text-primary rounded-full shrink-0">
          {tasks.length}
        </span>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-2 md:p-2.5"> {/* Slightly reduced padding for task list */}
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10 px-2">No tasks in this column.</p>
          )}
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} columns={allColumns} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
