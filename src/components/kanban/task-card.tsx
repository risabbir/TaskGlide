
"use client";
import type { Task, Column } from "@/lib/types";
import { PRIORITY_STYLES, RECURRENCE_ICON, DEPENDENCY_ICON, DEFAULT_COLUMNS } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, Trash2, ChevronsUpDown } from "lucide-react";
import { useKanban } from "@/lib/store";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react"; // Added React import

interface TaskCardProps {
  task: Task;
  columns: Column[];
}

export function TaskCard({ task, columns }: TaskCardProps) {
  const { dispatch, state: { tasks: allTasks } } = useKanban(); // Corrected to access allTasks from state
  const PriorityIcon = PRIORITY_STYLES[task.priority].icon;
  const priorityColor = PRIORITY_STYLES[task.priority].colorClass;

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && task.columnId !== "done";

  const handleMoveTask = (newColumnId: string) => {
    dispatch({ type: "MOVE_TASK", payload: { taskId: task.id, newColumnId } });
    if (newColumnId === 'done') {
      // Trigger confetti or other celebration
      const event = new CustomEvent('taskDoneConfetti', { detail: { taskId: task.id } });
      window.dispatchEvent(event);
    }
  };

  const handleEdit = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: task });
  };

  const handleDelete = () => {
    // Add confirmation dialog here if needed
    dispatch({ type: "DELETE_TASK", payload: task.id });
  };
  
  const hasIncompletePrerequisites = task.dependencies.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.columnId !== 'done';
  });
  
  const isInWorkingColumn = task.columnId === 'inprogress' || task.columnId === 'review';

  return (
    <Card className={cn(
      "mb-4 shadow-md hover:shadow-lg transition-shadow duration-200",
      isOverdue && "border-red-500 border-2",
      hasIncompletePrerequisites && isInWorkingColumn && "border-yellow-500 border-2 ring-2 ring-yellow-300"
    )}>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold leading-tight pr-2">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}><Edit2 className="mr-2 h-4 w-4" /> Edit Task</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          {task.dueDate && (
            <span className={cn(isOverdue && "text-red-500 font-semibold")}>
              Due: {format(task.dueDate, "MMM d, yyyy")}
            </span>
          )}
          <div className="flex items-center gap-1">
            <PriorityIcon className={cn("h-4 w-4", priorityColor)} />
            <span className={priorityColor}>{PRIORITY_STYLES[task.priority].label}</span>
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {task.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{task.tags.length - 3}</Badge>}
          </div>
        )}

        {totalSubtasks > 0 && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Subtasks</span>
              <span>{completedSubtasks} of {totalSubtasks}</span>
            </div>
            <Progress value={(completedSubtasks / totalSubtasks) * 100} className="h-1.5" />
          </div>
        )}
        
        <div className="flex items-center gap-2 text-muted-foreground">
            {task.recurrenceRule && <RECURRENCE_ICON className="h-4 w-4" title="Recurring Task" />}
            {task.dependencies.length > 0 && <DEPENDENCY_ICON className="h-4 w-4" title="Has Dependencies" />}
             {hasIncompletePrerequisites && isInWorkingColumn && (
              <Badge variant="destructive" className="text-xs">Blocked</Badge>
            )}
        </div>

      </CardContent>
      <CardFooter className="p-4 pt-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <ChevronsUpDown className="mr-2 h-4 w-4" /> Move to
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-[--radix-dropdown-menu-trigger-width)]">
            {columns.filter(col => col.id !== task.columnId).map(column => (
              <DropdownMenuItem key={column.id} onClick={() => handleMoveTask(column.id)}>
                 {column.icon && React.createElement(column.icon, { className: "mr-2 h-4 w-4"})}
                {column.title}
              </DropdownMenuItem>
            ))}
             {columns.length === 1 && task.columnId === columns[0].id && <DropdownMenuItem disabled>No other columns</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
