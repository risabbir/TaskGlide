
"use client";

import React, { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardDescription
import { Sparkles, Loader2, AlertTriangle, Lightbulb, CalendarDays } from "lucide-react";
import { useKanban } from "@/lib/store";
import type { Task } from "@/lib/types";
import { suggestFocusBatch, type SuggestFocusBatchInput, type FocusTaskSuggestion } from "@/ai/flows/suggest-focus-batch"; // Removed SuggestFocusBatchOutput
import { PRIORITY_STYLES } from "@/lib/constants";
import { formatDistanceToNowStrict, parseISO, format } from "date-fns";

interface FocusBatchModalContentProps {
  onClose: () => void;
}

export function FocusBatchModalContent({ onClose }: FocusBatchModalContentProps) {
  const { state } = useKanban();
  const { tasks: allTasks } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FocusTaskSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (allTasks.length === 0) {
        setError("No tasks available to suggest a focus batch.");
        return;
      }
      setIsLoading(true);
      setError(null);
      setSuggestions([]);

      const tasksForAI: SuggestFocusBatchInput['tasks'] = allTasks
        .filter(task => task.columnId !== 'done')
        .map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        columnId: task.columnId,
        description: task.description || "",
        dueDate: task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate) : undefined,
      }));

      if (tasksForAI.length === 0) {
        setError("All tasks are marked as done. Nothing to suggest for focus.");
        setIsLoading(false);
        return;
      }
      
      try {
        const result = await suggestFocusBatch({ tasks: tasksForAI });

        if (result.error) {
          console.warn("AI Focus Batch error from flow:", result.error);
          const errMessage = result.error.toLowerCase();
          if (errMessage.includes('503') || errMessage.includes('overloaded') || errMessage.includes('service unavailable') || errMessage.includes('timeout')) {
              setError("The AI service is currently busy or unavailable. Please try again in a few moments.");
          } else if (errMessage.includes('malformed response') || errMessage.includes('empty response')) {
              setError("AI returned an unexpected response. Please try again or check task details.");
          }
           else {
              setError("Failed to get suggestions from AI. Please try again.");
          }
        } else if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
        } else {
          // No error, but also no suggestions (e.g., AI explicitly returned empty)
          setError("AI couldn't find any specific tasks to suggest for focus right now. Try again later or with more tasks.");
        }
      } catch (err: any) {
        // This catch block is for unexpected errors *thrown* by the flow (e.g., non-retryable errors)
        console.error("Unexpected error fetching focus batch suggestions:", err);
        setError("An unexpected error occurred while fetching suggestions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks]); // Intentionally not including 'setError' as it's a stable dispatcher

  const getTaskDetails = (taskId: string): Task | undefined => {
    return allTasks.find(task => task.id === taskId);
  };

  return (
    <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] flex flex-col p-0">
      <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
        <DialogTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          AI Suggested Focus Batch
        </DialogTitle>
        <DialogDescription>
          Here are some tasks the AI suggests you focus on based on their priority, due dates, and other factors.
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">AI is thinking...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-medium mb-1">Oops! Something went wrong.</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {!isLoading && !error && suggestions.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-muted/50 border border-border rounded-lg">
              <Lightbulb className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">No specific suggestions right now.</p>
              <p className="text-sm text-muted-foreground">Either there are no pressing tasks, or the AI needs more information. Keep your tasks updated!</p>
            </div>
          )}
          {!isLoading && !error && suggestions.length > 0 && (
            <ul className="space-y-3">
              {suggestions.map(suggestion => {
                const task = getTaskDetails(suggestion.taskId);
                if (!task) return null;
                
                const PriorityIcon = PRIORITY_STYLES[task.priority].icon;
                const priorityColor = PRIORITY_STYLES[task.priority].colorClass;
                const parsedDueDate = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : parseISO(task.dueDate as any)) : null;
                
                return (
                  <li key={suggestion.taskId}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                         <div className="text-xs text-muted-foreground pt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className={`flex items-center font-medium ${priorityColor}`}>
                                <PriorityIcon className={`mr-1 h-3.5 w-3.5`} />
                                {PRIORITY_STYLES[task.priority].label} Priority
                            </span>
                           {parsedDueDate && 
                            <span className="flex items-center">
                                <CalendarDays className="mr-1 h-3.5 w-3.5" />
                                Due {format(parsedDueDate, "MMM d, yyyy")} ({formatDistanceToNowStrict(parsedDueDate, { addSuffix: true })})
                            </span>}
                         </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.reason}</p>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
