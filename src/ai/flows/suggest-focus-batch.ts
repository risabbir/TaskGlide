
'use server';
/**
 * @fileOverview An AI agent that suggests a batch of tasks to focus on.
 *
 * - suggestFocusBatch - A function that suggests tasks to focus on.
 * - SuggestFocusBatchInput - The input type for the suggestFocusBatch function.
 * - SuggestFocusBatchOutput - The return type for the suggestFocusBatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Priority } from '@/lib/types';

const TaskForAISchema = z.object({
    id: z.string(),
    title: z.string(),
    priority: z.custom<Priority>(),
    columnId: z.string(),
    description: z.string().optional(),
    dueDate: z.string().optional().describe("The due date of the task in ISO string format, if available."),
});


const SuggestFocusBatchInputSchema = z.object({
  tasks: z.array(TaskForAISchema).describe("A list of all available tasks."),
});
export type SuggestFocusBatchInput = z.infer<typeof SuggestFocusBatchInputSchema>;

const FocusTaskSuggestionSchema = z.object({
    taskId: z.string().describe("The ID of the suggested task."),
    title: z.string().describe("The title of the suggested task."),
    reason: z.string().describe("A brief reason why this task is suggested for focus."),
});
export type FocusTaskSuggestion = z.infer<typeof FocusTaskSuggestionSchema>;


const SuggestFocusBatchOutputSchema = z.object({
  suggestions: z.array(FocusTaskSuggestionSchema).describe('An array of suggested tasks to focus on. Empty if an error occurred.'),
  error: z.string().optional().describe('An error message if the operation failed after retries.'),
});
export type SuggestFocusBatchOutput = z.infer<typeof SuggestFocusBatchOutputSchema>;


export async function suggestFocusBatch(input: SuggestFocusBatchInput): Promise<SuggestFocusBatchOutput> {
  return suggestFocusBatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFocusBatchPrompt',
  input: {schema: SuggestFocusBatchInputSchema},
  // Prompt output schema does not include the 'error' field from SuggestFocusBatchOutputSchema
  output: {schema: z.object({ suggestions: z.array(FocusTaskSuggestionSchema) })},
  prompt: `You are an expert productivity assistant. Your goal is to help users prioritize their work by suggesting a small batch of tasks (around 2-3, but no more than 4) to focus on from their current task list.

Consider the following factors for each task:
- Priority (high, medium, low)
- Due Date (tasks due soon or overdue should be prioritized)
- Status (columnId: 'todo', 'inprogress', 'review', 'done'. Generally, tasks in 'todo' or 'inprogress' are candidates).
- Task title and description for context.

For each suggested task, provide its ID, title, and a concise reason (1-2 sentences) why it's recommended for immediate focus.

Current Date for Reference: ${new Date().toISOString().split('T')[0]}

Here is the list of tasks:
{{#each tasks}}
- Task ID: {{id}}
  Title: "{{title}}"
  Priority: {{priority}}
  {{#if dueDate}}Due Date: {{dueDate}}{{else}}No Due Date{{/if}}
  Status: {{columnId}}
  {{#if description}}Description: {{description}}{{/if}}
---
{{/each}}

Please provide your suggestions as a JSON array of objects, where each object has "taskId", "title", and "reason".
Example: { "suggestions": [ { "taskId": "task-abc", "title": "Finalize Report", "reason": "This task is high priority and due tomorrow." } ] }
If no tasks clearly stand out or the list is empty/all done, return an empty suggestions array.
`,
});

const suggestFocusBatchFlow = ai.defineFlow(
  {
    name: 'suggestFocusBatchFlow',
    inputSchema: SuggestFocusBatchInputSchema,
    outputSchema: SuggestFocusBatchOutputSchema,
  },
  async (input: SuggestFocusBatchInput): Promise<SuggestFocusBatchOutput> => {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 1000;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);

        if (output && output.suggestions) {
          const validatedSuggestions = output.suggestions.map(s => {
            const originalTask = input.tasks.find(t => t.id === s.taskId);
            return {
              ...s,
              title: s.title || originalTask?.title || "Unknown Task"
            };
          });
          return { suggestions: validatedSuggestions, error: undefined };
        } else if (output && Array.isArray(output.suggestions) && output.suggestions.length === 0) {
          // AI explicitly returned empty suggestions, which is a valid success case.
          return { suggestions: [], error: undefined };
        } else {
          lastError = new Error("AI returned an empty, malformed, or non-conforming response.");
          console.warn(`[suggestFocusBatchFlow] Attempt ${attempts + 1}: ${lastError.message}`);
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error.message || error).toLowerCase();
        console.warn(`[suggestFocusBatchFlow] Attempt ${attempts + 1} failed with error: ${errorMessage}`);

        if (errorMessage.includes('503') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('internal error') ||
            errorMessage.includes('timeout')) {
          // Retryable error
        } else {
          console.error(`[suggestFocusBatchFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          return {
            suggestions: [],
            error: `AI Focus Suggestion Error: ${error.message || 'Unknown non-retryable error'}`
          };
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts -1);
        console.log(`[suggestFocusBatchFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalErrorMessage = `Failed to get AI suggestions after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    console.warn(`[suggestFocusBatchFlow] ${finalErrorMessage}`);
    return { 
        suggestions: [], 
        error: finalErrorMessage 
    };
  }
);
