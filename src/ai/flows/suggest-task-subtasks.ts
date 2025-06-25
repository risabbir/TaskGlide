
'use server';
/**
 * @fileOverview AI-powered subtask suggestion flow.
 *
 * - suggestTaskSubtasks - A function that suggests subtasks for a given task title and description.
 * - SuggestTaskSubtasksInput - The input type for the suggestTaskSubtasks function.
 * - SuggestTaskSubtasksOutput - The return type for the suggestTaskSubtasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskSubtasksInputSchema = z.object({
  title: z.string().describe('The title of the main task.'),
  description: z.string().optional().describe('The description of the main task.'),
});
export type SuggestTaskSubtasksInput = z.infer<typeof SuggestTaskSubtasksInputSchema>;

const SuggestTaskSubtasksOutputSchema = z.object({
  subtasks: z
    .array(z.string())
    .describe('An array of suggested subtask titles. Empty if an error occurred.'),
  error: z.string().optional().describe('An error message if the operation failed after retries.'),
});
export type SuggestTaskSubtasksOutput = z.infer<typeof SuggestTaskSubtasksOutputSchema>;

export async function suggestTaskSubtasks(input: SuggestTaskSubtasksInput): Promise<SuggestTaskSubtasksOutput> {
  return suggestTaskSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskSubtasksPrompt',
  input: {schema: SuggestTaskSubtasksInputSchema},
  output: {schema: z.object({ subtasks: z.array(z.string()) })}, // Prompt output is just the subtasks
  prompt: `You are a helpful assistant that breaks down tasks into smaller, actionable subtasks.
Given the main task title and its description (if provided), suggest a list of subtasks.
Focus on creating 2-5 concise subtasks. Each subtask should be a short phrase.

Main Task Title: {{{title}}}
{{#if description}}
Main Task Description: {{{description}}}
{{/if}}

Return the subtasks as a JSON array of strings. For example: { "subtasks": ["Subtask 1", "Subtask 2"] }
`,
});

const suggestTaskSubtasksFlow = ai.defineFlow(
  {
    name: 'suggestTaskSubtasksFlow',
    inputSchema: SuggestTaskSubtasksInputSchema,
    outputSchema: SuggestTaskSubtasksOutputSchema,
  },
  async (input: SuggestTaskSubtasksInput): Promise<SuggestTaskSubtasksOutput> => {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 1000;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        if (output && output.subtasks) {
          return { subtasks: output.subtasks, error: undefined };
        } else {
          lastError = new Error("AI returned an empty or malformed response for subtask suggestions.");
          console.warn(`[suggestTaskSubtasksFlow] Attempt ${attempts + 1}: ${lastError.message}`);
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error.message || error).toLowerCase();
        console.warn(`[suggestTaskSubtasksFlow] Attempt ${attempts + 1} failed with error: ${errorMessage}`);

        if (errorMessage.includes('503') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('internal error') ||
            errorMessage.includes('timeout')) {
          // Retryable error
        } else {
          console.error(`[suggestTaskSubtasksFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          return {
            subtasks: [],
            error: `AI Subtask Suggestion Error: ${error.message || 'Unknown non-retryable error'}`
          };
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts - 1);
        console.log(`[suggestTaskSubtasksFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalErrorMessage = `Failed to suggest task subtasks after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    console.warn(`[suggestTaskSubtasksFlow] ${finalErrorMessage}`);
    return { 
        subtasks: [], 
        error: finalErrorMessage 
    };
  }
);
