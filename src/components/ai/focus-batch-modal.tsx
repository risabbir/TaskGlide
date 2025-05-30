
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, AlertTriangle, Lightbulb } from "lucide-react";
import { useKanban } from "@/lib/store";
import type { Task, Priority } from "@/lib/types";
import { suggestFocusBatch, type SuggestFocusBatchInput, type SuggestFocusBatchOutput, type FocusTaskSuggestion } from "@/ai/flows/suggest-focus-batch";
import { PRIORITY_STYLES } from "@/lib/constants";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

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

      try {
        const tasksForAI: SuggestFocusBatchInput['tasks'] = allTasks.map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          columnId: task.columnId,
          description: task.description || "",
          // Ensure dueDate is a string if it exists, or undefined
          dueDate: task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate) : undefined,
        }));

        const result = await suggestFocusBatch({ tasks: tasksForAI });
        if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
        } else {
          setError("AI couldn't find any specific tasks to suggest for focus right now. Try again later or with more tasks.");
        }
      } catch (err) {
        console.error("Error fetching focus batch suggestions:", err);
        setError("Failed to get suggestions from AI. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [allTasks]);

  const getTaskDetails = (taskId: string): Task | undefined => {
    return allTasks.find(task => task.id === taskId);
  };

  return (
    <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          AI Suggested Focus Batch
        </DialogTitle>
        <DialogDescription>
          Here are some tasks the AI suggests you focus on based on their priority, due dates, and other factors.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-grow min-h-0 pr-3">
        <div className="py-4 space-y-4">
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
                
                return (
                  <li key={suggestion.taskId}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                         <CardDescription className="text-xs text-muted-foreground pt-0.5">
                           {PRIORITY_STYLES[task.priority].label} Priority
                           {task.dueDate && 
                            <span> &bull; Due {
                                task.dueDate instanceof Date 
                                ? formatDistanceToNowStrict(task.dueDate, { addSuffix: true }) 
                                : formatDistanceToNowStrict(parseISO(task.dueDate as any), { addSuffix: true })
                            }</span>}
                         </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.reason}</p>
                         {/* Optionally show a few more details from the task if needed */}
                         {/* <div className="mt-2 text-xs">
                           <Badge variant="outline">{task.columnId}</Badge>
                         </div> */}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="mt-auto pt-4 border-t flex-shrink-0">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
