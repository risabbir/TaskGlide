
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
  suggestions: z.array(FocusTaskSuggestionSchema).describe('An array of suggested tasks to focus on, each with a reason.'),
});
export type SuggestFocusBatchOutput = z.infer<typeof SuggestFocusBatchOutputSchema>;


export async function suggestFocusBatch(input: SuggestFocusBatchInput): Promise<SuggestFocusBatchOutput> {
  return suggestFocusBatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFocusBatchPrompt',
  input: {schema: SuggestFocusBatchInputSchema},
  output: {schema: SuggestFocusBatchOutputSchema},
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
  async input => {
    // Filter out 'done' tasks before sending to AI, if many tasks exist this could save tokens.
    // However, the AI might also benefit from seeing recently completed tasks for context.
    // For now, sending all. Can be optimized later.
    const {output} = await prompt(input);
     if (output && output.suggestions) {
      // Further ensure that titles are included in the suggestions from AI output.
      // Sometimes the model might only return taskId and reason if not strictly guided.
      const validatedSuggestions = output.suggestions.map(s => {
        const originalTask = input.tasks.find(t => t.id === s.taskId);
        return {
          ...s,
          title: s.title || originalTask?.title || "Unknown Task" // Fallback for title
        };
      });
      return { suggestions: validatedSuggestions };
    }
    return { suggestions: [] }; // Fallback
  }
);
