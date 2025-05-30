
"use client";
import React, { useState } from "react"; // Added useState
import type { Task, Column, Subtask } from "@/lib/types";
import { PRIORITIES, PRIORITY_STYLES, RECURRENCE_ICON, DEPENDENCY_ICON } from "@/lib/constants";
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
import { MoreVertical, Edit2, Trash2, ChevronsUpDown, ChevronDown, ChevronUp, CalendarDays, Info } from "lucide-react";
import { useKanban } from "@/lib/store";
import { format, isPast, isToday, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { SubtaskItem } from "../task/subtask-item"; // For displaying subtasks in expanded view

interface TaskCardProps {
  task: Task;
  columns: Column[];
}

export function TaskCard({ task, columns }: TaskCardProps) {
  const { dispatch, state: { tasks: allTasks } } = useKanban();
  const [isExpanded, setIsExpanded] = useState(false);

  const PriorityIcon = PRIORITY_STYLES[task.priority].icon;
  const priorityColor = PRIORITY_STYLES[task.priority].colorClass;

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && task.columnId !== "done";

  const handleMoveTask = (newColumnId: string) => {
    dispatch({ type: "MOVE_TASK", payload: { taskId: task.id, newColumnId } });
    if (newColumnId === 'done') {
      const event = new CustomEvent('taskDoneConfetti', { detail: { taskId: task.id } });
      window.dispatchEvent(event);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    dispatch({ type: "OPEN_TASK_MODAL", payload: task });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    // TODO: Add confirmation dialog here
    dispatch({ type: "DELETE_TASK", payload: task.id });
  };
  
  const hasIncompletePrerequisites = task.dependencies.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.columnId !== 'done';
  });
  
  const isInWorkingColumn = task.columnId === 'inprogress' || task.columnId === 'review';

  const toggleExpand = (e?: React.MouseEvent) => {
    // Allow expansion only if not clicking on interactive elements like dropdown triggers
     if (e) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-radix-dropdown-menu-trigger], button')) {
             // If the click is on a dropdown trigger or any button, don't toggle expansion
            return;
        }
    }
    setIsExpanded(!isExpanded);
  };

  const getRecurrenceText = (rule?: Task['recurrenceRule']) => {
    if (!rule) return null;
    switch (rule.type) {
      case 'daily': return 'Recurs daily';
      case 'weekly': return 'Recurs weekly';
      case 'monthly': return 'Recurs monthly';
      default: return null;
    }
  };

  return (
    <Card 
      className={cn(
        "mb-4 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer",
        isOverdue && "border-destructive border-2",
        hasIncompletePrerequisites && isInWorkingColumn && "border-yellow-500 border-2 ring-2 ring-yellow-300",
        isExpanded && "shadow-xl"
      )}
      onClick={toggleExpand}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold leading-tight pr-2 flex-grow">{task.title}</CardTitle>
          <div className="flex items-center shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 mr-1" onClick={toggleExpand} aria-label={isExpanded ? "Collapse task" : "Expand task"}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleEdit}><Edit2 className="mr-2 h-4 w-4" /> Edit Task</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {!isExpanded && task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* Basic Info - Always Visible */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1" title={`Priority: ${PRIORITY_STYLES[task.priority].label}`}>
            <PriorityIcon className={cn("h-4 w-4", priorityColor)} />
            <span className={priorityColor}>{PRIORITY_STYLES[task.priority].label}</span>
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1" title={`Due: ${format(task.dueDate, "PPP")}`}>
                <CalendarDays className={cn("h-3.5 w-3.5", isOverdue && "text-destructive")} />
                <span className={cn(isOverdue && "text-destructive font-semibold")}>
                    {format(task.dueDate, "MMM d")}
                </span>
            </div>
          )}
        </div>

        {!isExpanded && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 2).map(tag => ( // Show fewer tags in collapsed view
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
            ))}
            {task.tags.length > 2 && <Badge variant="secondary" className="text-xs px-1.5 py-0.5">+{task.tags.length - 2}</Badge>}
          </div>
        )}
        
        {!isExpanded && totalSubtasks > 0 && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
              <span>Subtasks</span>
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <Progress value={(completedSubtasks / totalSubtasks) * 100} className="h-1" />
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-2 space-y-3 text-sm">
            {task.description && (
              <div>
                <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
            
            {task.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">TAGS</h4>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {task.subtasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">SUBTASKS ({completedSubtasks}/{totalSubtasks})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {task.subtasks.map(subtask => (
                    <SubtaskItem 
                      key={subtask.id} 
                      subtask={subtask} 
                      onToggle={() => dispatch({type: "TOGGLE_SUBTASK", payload: {taskId: task.id, subtaskId: subtask.id}})}
                      onUpdate={(updatedSubtask) => dispatch({type: "UPDATE_SUBTASK", payload: {taskId: task.id, subtask: updatedSubtask}})}
                      onDelete={() => dispatch({type: "DELETE_SUBTASK", payload: {taskId: task.id, subtaskId: subtask.id}})}
                      isEditing={false} // View only in expanded card, edit in modal
                    />
                  ))}
                </div>
              </div>
            )}

            {task.dependencies.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">DEPENDENCIES (Prerequisites)</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                        {task.dependencies.map(depId => {
                            const depTask = allTasks.find(t => t.id === depId);
                            return <li key={depId}>{depTask ? depTask.title : `Task ID: ${depId}`} {depTask && depTask.columnId === 'done' ? '(Done)' : ''}</li>;
                        })}
                    </ul>
                </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
                {task.recurrenceRule && (
                    <div className="flex items-center gap-1.5">
                        <RECURRENCE_ICON className="h-3.5 w-3.5" />
                        <span>{getRecurrenceText(task.recurrenceRule)}</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5" title={`Created: ${format(task.createdAt, "PPP p")}`}>
                    <Info className="h-3.5 w-3.5" />
                    <span>Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
                </div>
            </div>


          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground mt-2">
            {hasIncompletePrerequisites && isInWorkingColumn && (
              <Badge variant="destructive" className="text-xs">Blocked by Prerequisite</Badge>
            )}
        </div>

      </CardContent>
      {!isExpanded && (
        <CardFooter className="p-3 pt-1">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                <ChevronsUpDown className="mr-1.5 h-3.5 w-3.5" /> Move to
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[--radix-dropdown-menu-trigger-width)]" onClick={(e) => e.stopPropagation()}>
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
      )}
    </Card>
  );
}
