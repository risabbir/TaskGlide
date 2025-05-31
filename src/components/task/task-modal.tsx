
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useKanban } from "@/lib/store";
import type { Task, Priority, RecurrenceRule, RecurrenceType, Subtask } from "@/lib/types";
import { PRIORITIES, PRIORITY_STYLES, DEFAULT_COLUMNS } from "@/lib/constants";
import { CalendarIcon, PlusCircle, Trash2, Sparkles, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { enhanceTaskDescription } from "@/ai/flows/enhance-task-description";
import { suggestTaskTags } from "@/ai/flows/suggest-task-tags";
import { suggestTaskSubtasks } from "@/ai/flows/suggest-task-subtasks";
import { SubtaskItem } from "./subtask-item";
import { useToast } from "@/hooks/use-toast";


const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  columnId: z.string().min(1, "Column is required"),
  dueDate: z.date().optional(),
  priority: z.enum(PRIORITIES),
  tags: z.string().optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Subtask title cannot be empty"),
    completed: z.boolean(),
  })).optional(),
  dependencies: z.array(z.string()).optional(),
  recurrenceType: z.enum(["", "daily", "weekly", "monthly"]).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const NO_RECURRENCE_VALUE = "no_recurrence";
const NO_DEPENDENCIES_PLACEHOLDER = "no_options_dependencies_placeholder_value";


export function TaskModal() {
  const { state, dispatch } = useKanban();
  const { isTaskModalOpen, activeTaskModal, columns, tasks: allTasks } = state;
  const { toast } = useToast();

  const [isAiDescriptionLoading, setIsAiDescriptionLoading] = useState(false);
  const [isAiTagsLoading, setIsAiTagsLoading] = useState(false);
  const [isAiSubtasksLoading, setIsAiSubtasksLoading] = useState(false);


  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      columnId: DEFAULT_COLUMNS[0].id,
      priority: "medium",
      tags: "",
      subtasks: [],
      dependencies: [],
      recurrenceType: "",
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask, update: updateSubtaskField } = useFieldArray({
    control,
    name: "subtasks",
  });

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");

  useEffect(() => {
    if (activeTaskModal) {
      reset({
        title: activeTaskModal.title,
        description: activeTaskModal.description || "",
        columnId: activeTaskModal.columnId,
        dueDate: activeTaskModal.dueDate ? (activeTaskModal.dueDate instanceof Date ? activeTaskModal.dueDate : parseISO(activeTaskModal.dueDate as any)) : undefined,
        priority: activeTaskModal.priority,
        tags: activeTaskModal.tags.join(", "),
        subtasks: activeTaskModal.subtasks.map(st => ({...st})),
        dependencies: activeTaskModal.dependencies,
        recurrenceType: activeTaskModal.recurrenceRule?.type || "",
      });
    } else {
      reset({
        title: "", description: "", columnId: DEFAULT_COLUMNS[0].id,
        priority: "medium", tags: "", subtasks: [], dependencies: [], recurrenceType: "", dueDate: undefined,
      });
    }
  }, [activeTaskModal, reset]);

  const onSubmit = (data: TaskFormData) => {
    const baseTaskData: Partial<Task> = {
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      dueDate: data.dueDate,
      priority: data.priority,
      tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(tag => tag) : [],
      subtasks: data.subtasks || [],
      dependencies: data.dependencies || [],
      recurrenceRule: data.recurrenceType && data.recurrenceType !== NO_RECURRENCE_VALUE ? { type: data.recurrenceType as RecurrenceType } : undefined,
      updatedAt: new Date(),
    };

    if (activeTaskModal) {
      dispatch({ type: "UPDATE_TASK", payload: {
        ...activeTaskModal,
        ...baseTaskData,
        timerActive: activeTaskModal.timerActive,
        timeSpentSeconds: activeTaskModal.timeSpentSeconds,
        timerStartTime: activeTaskModal.timerStartTime,
      } as Task });
      toast({ title: "Task Updated", description: `Task "${data.title}" has been updated.` });
    } else {
      dispatch({ type: "ADD_TASK", payload: {
          ...baseTaskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          timerActive: false,
          timeSpentSeconds: 0,
          timerStartTime: null,
        } as Task,
      });
      toast({ title: "Task Created", description: `New task "${data.title}" has been added.` });
    }
    closeModal();
  };

  const closeModal = () => {
    dispatch({ type: "CLOSE_TASK_MODAL" });
    reset();
    setIsAiDescriptionLoading(false);
    setIsAiTagsLoading(false);
    setIsAiSubtasksLoading(false);
  };

  const handleEnhanceDescription = async () => {
    if (!watchedTitle) {
        toast({ title: "Title Needed", description: "Please provide a title to enhance the description.", variant: "destructive" });
        return;
    }
    setIsAiDescriptionLoading(true);
    try {
        const result = await enhanceTaskDescription({ title: watchedTitle, existingDescription: watchedDescription || "" });
        if (result.enhancedDescription) {
            setValue("description", result.enhancedDescription);
            toast({ title: "Description Enhanced", description: "AI has enhanced the task description." });
        }
    } catch (error) {
        console.error("Error enhancing description:", error);
        toast({ title: "Error", description: "Could not enhance description.", variant: "destructive" });
    } finally {
        setIsAiDescriptionLoading(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!watchedTitle) {
        toast({ title: "Title Needed", description: "Please provide a title to suggest tags.", variant: "destructive" });
        return;
    }
    setIsAiTagsLoading(true);
    try {
        const result = await suggestTaskTags({ title: watchedTitle, description: watchedDescription || "" });
        if (result.tags && result.tags.length > 0) {
            setValue("tags", result.tags.join(", "));
            toast({ title: "Tags Suggested", description: "AI has suggested tags for your task." });
        } else {
            toast({ title: "No Tags Suggested", description: "AI could not suggest any tags for this task." });
        }
    } catch (error) {
        console.error("Error suggesting tags:", error);
        toast({ title: "Error", description: "Could not suggest tags.", variant: "destructive" });
    } finally {
        setIsAiTagsLoading(false);
    }
  };

  const handleSuggestSubtasks = async () => {
    if (!watchedTitle) {
        toast({ title: "Title Needed", description: "Please provide a title to suggest subtasks.", variant: "destructive" });
        return;
    }
    setIsAiSubtasksLoading(true);
    try {
        const result = await suggestTaskSubtasks({ title: watchedTitle, description: watchedDescription || "" });
        if (result.subtasks && result.subtasks.length > 0) {
            result.subtasks.forEach(subtaskTitle => {
                appendSubtask({ id: crypto.randomUUID(), title: subtaskTitle, completed: false });
            });
            toast({ title: "Subtasks Suggested", description: "AI has suggested subtasks." });
        } else {
            toast({ title: "No Subtasks Suggested", description: "AI found no subtasks for this." });
        }
    } catch (error) {
        console.error("Error suggesting subtasks:", error);
        toast({ title: "Error", description: "Could not suggest subtasks.", variant: "destructive" });
    } finally {
        setIsAiSubtasksLoading(false);
    }
  };

  const handleAddSubtask = () => {
    appendSubtask({ id: crypto.randomUUID(), title: "", completed: false });
  };

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    const subtaskIndex = subtaskFields.findIndex(sf => sf.id === subtaskId);
    if (subtaskIndex !== -1) {
        const currentSubtask = subtaskFields[subtaskIndex];
        updateSubtaskField(subtaskIndex, { ...currentSubtask, completed: !currentSubtask.completed });
    }
  }, [subtaskFields, updateSubtaskField]);

  const handleUpdateSubtask = useCallback((updatedSubtask: Subtask) => {
    const subtaskIndex = subtaskFields.findIndex(sf => sf.id === updatedSubtask.id);
    if (subtaskIndex !== -1) {
      updateSubtaskField(subtaskIndex, updatedSubtask);
    }
  }, [subtaskFields, updateSubtaskField]);

  const handleDeleteSubtask = useCallback((subtaskId: string) => {
    const subtaskIndex = subtaskFields.findIndex(sf => sf.id === subtaskId);
    if (subtaskIndex !== -1) {
      removeSubtask(subtaskIndex);
    }
  }, [subtaskFields, removeSubtask]);


  if (!isTaskModalOpen) return null;

  return (
    <Dialog open={isTaskModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle>{activeTaskModal ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {activeTaskModal ? "Update the details of your task." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 px-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="E.g., Finalize project proposal" />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="description">Description</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleEnhanceDescription} disabled={isAiDescriptionLoading || !watchedTitle}>
                  {isAiDescriptionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Enhance with AI
                </Button>
              </div>
              <Textarea id="description" {...register("description")} placeholder="Add more details about the task..." rows={4} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column */}
              <div>
                <Label htmlFor="columnId">Status / Column</Label>
                <Controller
                  name="columnId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                      <SelectContent>
                        {columns.map(col => <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p} value={p}>
                            <div className="flex items-center gap-2">
                              {React.createElement(PRIORITY_STYLES[p].icon, { className: cn("h-4 w-4", PRIORITY_STYLES[p].colorClass) })}
                              <span>{PRIORITY_STYLES[p].label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Recurrence */}
              <div>
                <Label htmlFor="recurrenceType">Recurrence</Label>
                <Controller
                  name="recurrenceType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(value === NO_RECURRENCE_VALUE ? "" : value)}
                      value={field.value === "" || field.value === undefined ? NO_RECURRENCE_VALUE : field.value}
                    >
                      <SelectTrigger><SelectValue placeholder="Set recurrence" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RECURRENCE_VALUE}>None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleSuggestTags} disabled={isAiTagsLoading || !watchedTitle}>
                  {isAiTagsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Suggest Tags
                </Button>
              </div>
              <Input id="tags" {...register("tags")} placeholder="E.g., project-alpha, urgent, bug" />
              {watch("tags") && <div className="mt-2 flex flex-wrap gap-1">
                {watch("tags")!.split(",").map(t => t.trim()).filter(t => t).map(tag => <Badge key={tag} variant="outline" className="px-2 py-0.5">{tag}</Badge>)}
              </div>}
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">Subtasks</Label>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSuggestSubtasks} disabled={isAiSubtasksLoading || !watchedTitle}>
                        {isAiSubtasksLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        AI Suggest
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Subtask
                    </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 border rounded-md p-2 custom-scrollbar">
                {subtaskFields.map((field, index) => (
                   <SubtaskItem
                    key={field.id}
                    subtask={{ id: field.id, title: field.title, completed: field.completed }}
                    onToggle={() => handleToggleSubtask(field.id)}
                    onUpdate={(updatedSubtask) => handleUpdateSubtask(updatedSubtask)}
                    onDelete={() => handleDeleteSubtask(field.id)}
                  />
                ))}
                {subtaskFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No subtasks yet.</p>}
              </div>
            </div>

            {/* Dependencies */}
            <div>
                <Label htmlFor="dependencies" className="text-base font-semibold mb-1 block">Dependencies (Prerequisites)</Label>
                <Controller
                    name="dependencies"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <Select
                                onValueChange={(value) => {
                                    const currentDeps = field.value || [];
                                    if (value && value !== NO_DEPENDENCIES_PLACEHOLDER && !currentDeps.includes(value)) {
                                        field.onChange([...currentDeps, value]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Add prerequisite task..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allTasks
                                        .filter(t => t.id !== activeTaskModal?.id && !(field.value || []).includes(t.id))
                                        .map(task => (
                                            <SelectItem key={task.id} value={task.id}>
                                                {task.title}
                                            </SelectItem>
                                        ))}
                                    {allTasks.filter(t => t.id !== activeTaskModal?.id && !(field.value || []).includes(t.id)).length === 0 && (
                                        <SelectItem value={NO_DEPENDENCIES_PLACEHOLDER} disabled>
                                          {NO_DEPENDENCIES_PLACEHOLDER === "no_options_dependencies_placeholder_value" ? "No available tasks to select" : NO_DEPENDENCIES_PLACEHOLDER}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {(field.value && field.value.length > 0) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {field.value.map(depId => {
                                        const depTask = allTasks.find(t => t.id === depId);
                                        return depTask ? (
                                            <Badge key={depId} variant="secondary" className="flex items-center gap-1 pr-1">
                                                {depTask.title}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 hover:bg-transparent text-muted-foreground hover:text-destructive"
                                                    onClick={() => field.onChange((field.value || []).filter(id => id !== depId))}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                />
            </div>
          </form>
        </div>
        <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit(onSubmit)}>
            {activeTaskModal ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


    