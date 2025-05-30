
"use client";
import React, { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Edit2, Trash2, ChevronsUpDown, ChevronDown, ChevronUp, CalendarDays, Info, Clock, Play, Pause } from "lucide-react";
import { useKanban } from "@/lib/store";
import { format, isPast, isToday, formatDistanceToNow, parseISO } from "date-fns";
import { cn, formatTime } from "@/lib/utils";
import { SubtaskItem } from "../task/subtask-item";

interface TaskCardProps {
  task: Task;
  columns: Column[];
}

export function TaskCard({ task, columns }: TaskCardProps) {
  const { dispatch, state: { tasks: allTasks } } = useKanban();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState(task.timeSpentSeconds);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (task.timerActive && typeof task.timerStartTime === 'number') {
      const updateDisplayedTime = () => {
        const elapsed = Math.floor((Date.now() - (task.timerStartTime as number)) / 1000);
        setDisplayTime(task.timeSpentSeconds + elapsed);
      };
      updateDisplayedTime(); // Initial update
      intervalId = setInterval(updateDisplayedTime, 1000);
    } else {
      setDisplayTime(task.timeSpentSeconds);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [task.timerActive, task.timerStartTime, task.timeSpentSeconds]);


  const PriorityIcon = PRIORITY_STYLES[task.priority].icon;
  const priorityColor = PRIORITY_STYLES[task.priority].colorClass;

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const parsedDueDate = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : parseISO(task.dueDate as any)) : null;
  const isOverdue = parsedDueDate && isPast(parsedDueDate) && !isToday(parsedDueDate) && task.columnId !== "done";

  const handleMoveTask = (newColumnId: string) => {
    dispatch({ type: "MOVE_TASK", payload: { taskId: task.id, newColumnId } });
    if (newColumnId === 'done') {
      const event = new CustomEvent('taskDoneConfetti', { detail: { taskId: task.id } });
      window.dispatchEvent(event);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "OPEN_TASK_MODAL", payload: task });
  };

  const openDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "DELETE_TASK", payload: task.id });
    setIsDeleteDialogOpen(false);
  };

  const hasIncompletePrerequisites = task.dependencies.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.columnId !== 'done';
  });

  const isInWorkingColumn = task.columnId === 'inprogress' || task.columnId === 'review';


  const toggleExpand = (e?: React.MouseEvent) => {
     if (e) {
        const target = e.target as HTMLElement;
        // Check if the click originated from an element that should not trigger expansion
        if (target.closest('.no-expand, [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="dialog"], [role="alertdialog"], button, a, input[type="checkbox"], label, [data-radix-collection-item]')) {
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

  const handleTimerToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (task.timerActive) {
      dispatch({ type: "STOP_TIMER", payload: task.id });
    } else {
      dispatch({ type: "START_TIMER", payload: task.id });
    }
  };


  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <Card
        className={cn(
          "mb-2.5 shadow-sm hover:shadow-md transition-shadow duration-200 group/task-card rounded-lg",
          !isExpanded && "cursor-pointer",
          isOverdue && "border-destructive border-2 ring-1 ring-destructive/30",
          hasIncompletePrerequisites && isInWorkingColumn && "border-yellow-500 border-2 ring-1 ring-yellow-300",
          isExpanded && "shadow-lg ring-1 ring-primary/30"
        )}
        onClick={toggleExpand}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start gap-2">
            <div className={cn("text-base font-semibold leading-tight pr-1 flex-grow break-words", !isExpanded ? "line-clamp-2" : "")} title={task.title}>
              {task.title}
            </div>
            
            <div className="flex items-center shrink-0 no-expand">
              <Button variant="ghost" size="icon" className="h-7 w-7 mr-0.5 no-expand" onClick={toggleExpand} aria-label={isExpanded ? "Collapse task" : "Expand task"}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 no-expand" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Task options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={handleEdit} className="no-expand"><Edit2 className="mr-2 h-4 w-4" /> Edit Task</DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                     <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 no-expand"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(e);}}
                      >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn("p-3 pt-0", !isExpanded ? "pb-2.5" : "pb-3")}>
          {!isExpanded && (
            <div className="space-y-2 text-xs">
              {/* Row 1: Priority & Key Date */}
              <div className="flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-1" title={`Priority: ${PRIORITY_STYLES[task.priority].label}`}>
                  <PriorityIcon className={cn("h-3.5 w-3.5", priorityColor)} />
                  <span className={cn(priorityColor, "font-medium")}>{PRIORITY_STYLES[task.priority].label}</span>
                </div>
                {parsedDueDate ? (
                    <div className="flex items-center gap-1" title={`Due: ${format(parsedDueDate, "PPP")}`}>
                        <CalendarDays className={cn("h-3.5 w-3.5", isOverdue && "text-destructive")} />
                        <span className={cn(isOverdue && "text-destructive font-semibold", "font-medium")}>
                            Due {format(parsedDueDate, "MMM d")}
                        </span>
                        {isOverdue && <Badge variant="destructive" className="text-xs ml-1 py-0 px-1 h-auto">Overdue</Badge>}
                    </div>
                ) : (
                    <div className="flex items-center gap-1" title={`Created: ${format(task.createdAt, "PPP")}`}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>Created: {format(task.createdAt, "MMM d")}</span>
                    </div>
                )}
              </div>

              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>
                  ))}
                  {task.tags.length > 2 && <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">+{task.tags.length - 2}</Badge>}
                </div>
              )}

              {totalSubtasks > 0 && (
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5 text-xs">
                    <span>Subtasks</span>
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                  </div>
                  <Progress value={(completedSubtasks / totalSubtasks) * 100} className="h-1.5" />
                </div>
              )}
              
              {task.columnId === 'inprogress' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-muted-foreground" title="Time spent">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTime(displayTime)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 no-expand" 
                    onClick={handleTimerToggle}
                    aria-label={task.timerActive ? "Stop timer" : "Start timer"}
                  >
                    {task.timerActive ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isExpanded && (
            <div className="mt-1 space-y-3 text-sm">
              {task.description && (
                <div className="pt-1">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-0.5 tracking-wide uppercase">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm break-words">{task.description}</p>
                </div>
              )}
              
              {task.columnId === 'inprogress' && (
                <div className="flex items-center justify-between pt-2 pb-1 border-b border-dashed">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Time Tracker</h4>
                  <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-muted-foreground" title="Time spent">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium text-foreground">{formatTime(displayTime)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 no-expand" 
                        onClick={handleTimerToggle}
                        aria-label={task.timerActive ? "Stop timer" : "Start timer"}
                      >
                        {task.timerActive ? <Pause className="mr-1.5 h-4 w-4" /> : <Play className="mr-1.5 h-4 w-4" />}
                        {task.timerActive ? "Stop" : "Start"}
                      </Button>
                  </div>
                </div>
              )}


              {parsedDueDate && (
                  <div className="flex items-center gap-1.5 text-sm" title={`Due: ${format(parsedDueDate, "PPP")}`}>
                      <CalendarDays className={cn("h-4 w-4", isOverdue ? "text-destructive" : "text-muted-foreground")} />
                      <span className={cn("font-medium", isOverdue ? "text-destructive" : "text-foreground")}>
                          Due {format(parsedDueDate, "PPP")}
                      </span>
                      {isOverdue && <Badge variant="destructive" className="text-xs ml-1">Overdue</Badge>}
                  </div>
              )}

              {task.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1 tracking-wide uppercase">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.subtasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1 tracking-wide uppercase">Subtasks ({completedSubtasks}/{totalSubtasks})</h4>
                   {totalSubtasks > 0 && <Progress value={(completedSubtasks / totalSubtasks) * 100} className="h-1.5 mb-1.5" />}
                  <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {task.subtasks.map(subtask => (
                      <SubtaskItem
                        key={subtask.id}
                        subtask={subtask}
                        onToggle={() => dispatch({type: "TOGGLE_SUBTASK", payload: {taskId: task.id, subtaskId: subtask.id}})}
                        onUpdate={(updatedSubtask) => dispatch({type: "UPDATE_SUBTASK", payload: {taskId: task.id, subtask: updatedSubtask}})}
                        onDelete={() => dispatch({type: "DELETE_SUBTASK", payload: {taskId: task.id, subtaskId: subtask.id}})}
                        isEditing={false} 
                        className="py-0.5 text-xs bg-background/30 hover:bg-background/70 rounded px-1"
                      />
                    ))}
                  </div>
                </div>
              )}

              {task.dependencies.length > 0 && (
                  <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 tracking-wide uppercase">Prerequisites</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pl-1">
                          {task.dependencies.map(depId => {
                              const depTask = allTasks.find(t => t.id === depId);
                              return (
                                  <li key={depId} className={cn("break-words", depTask && depTask.columnId === 'done' && "line-through")}>
                                      {depTask ? depTask.title : `Task ID: ${depId}`} {depTask && depTask.columnId === 'done' ? <span className="text-green-600 dark:text-green-500">(Done)</span> : ''}
                                  </li>
                              );
                          })}
                      </ul>
                  </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1 pt-2.5 border-t border-dashed mt-2.5">
                  {task.recurrenceRule && (
                      <div className="flex items-center gap-1.5">
                          <RECURRENCE_ICON className="h-3.5 w-3.5" />
                          <span>{getRecurrenceText(task.recurrenceRule)}</span>
                      </div>
                  )}
                   <div className="flex items-center gap-1.5" title={`Created: ${format(task.createdAt, "PPP 'at' p")}`}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>Created: {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title={`Last updated: ${format(task.updatedAt, "PPP 'at' p")}`}>
                      <Info className="h-3.5 w-3.5" />
                      <span>Updated: {formatDistanceToNow(task.updatedAt, { addSuffix: true })}</span>
                  </div>
              </div>
            </div>
          )}

          {hasIncompletePrerequisites && isInWorkingColumn && (
            <Badge variant="destructive" className="text-xs mt-2 w-full justify-center py-1 font-medium">
              <DEPENDENCY_ICON className="mr-1.5 h-3 w-3"/> Blocked by Prerequisite
            </Badge>
          )}
        </CardContent>

        <CardFooter className={cn("p-3 no-expand", isExpanded ? "pt-2" : "pt-1.5")}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs no-expand" onClick={(e) => e.stopPropagation()}>
                <ChevronsUpDown className="mr-1.5 h-3.5 w-3.5" /> Move to
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[--radix-dropdown-menu-trigger-width)]" onClick={(e) => e.stopPropagation()}>
                {columns.filter(col => col.id !== task.columnId).map(column => (
                <DropdownMenuItem key={column.id} onClick={() => { handleMoveTask(column.id); }} className="no-expand">
                    {column.icon && React.createElement(column.icon, { className: "mr-2 h-4 w-4"})}
                    {column.title}
                </DropdownMenuItem>
                ))}
                {columns.length === 1 && task.columnId === columns[0].id && <DropdownMenuItem disabled>No other columns</DropdownMenuItem>}
            </DropdownMenuContent>
            </DropdownMenu>
        </CardFooter>
      </Card>

      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the task "{task.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => {e.stopPropagation(); setIsDeleteDialogOpen(false);}} className="no-expand">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 no-expand">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
