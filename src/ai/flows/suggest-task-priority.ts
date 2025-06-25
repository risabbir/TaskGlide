
'use server';
/**
 * @fileOverview AI-powered task priority suggestion flow.
 *
 * - suggestTaskPriority - A function that suggests a priority for a given task.
 * - SuggestTaskPriorityInput - The input type for the suggestTaskPriority function.
 * - SuggestTaskPriorityOutput - The return type for the suggestTaskPriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Priority } from '@/lib/types';

const SuggestTaskPriorityInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  dueDate: z.string().optional().describe('The due date of the task in ISO string format, if available.'),
});
export type SuggestTaskPriorityInput = z.infer<typeof SuggestTaskPriorityInputSchema>;

const SuggestTaskPriorityOutputSchema = z.object({
  suggestedPriority: z.custom<Priority>().describe('The suggested priority: "high", "medium", or "low". Null if an error occurred or no suggestion could be made.'),
  reason: z.string().describe('A brief reason for the suggested priority. Empty if an error or no suggestion.'),
  error: z.string().optional().describe('An error message if the operation failed after retries.'),
});
export type SuggestTaskPriorityOutput = z.infer<typeof SuggestTaskPriorityOutputSchema>;

export async function suggestTaskPriority(input: SuggestTaskPriorityInput): Promise<SuggestTaskPriorityOutput> {
  return suggestTaskPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPriorityPrompt',
  input: {schema: SuggestTaskPriorityInputSchema},
  // Prompt output schema does not include the 'error' field from SuggestTaskPriorityOutputSchema
  output: {schema: z.object({ suggestedPriority: z.custom<Priority>(), reason: z.string() })},
  prompt: `You are an expert project manager. Based on the task title, description (if any), and due date (if any), suggest a priority level (high, medium, or low).
Consider urgency based on the due date and importance implied by the task's content.
Tasks with near due dates or critical keywords (e.g., "urgent", "blocker", "deadline") should lean towards higher priority.
Tasks with far due dates, no due dates, or vague descriptions should lean towards lower priority.
If no strong indicators are present, 'medium' is a safe default.

Today's date for reference: ${new Date().toISOString().split('T')[0]}

Task Title: {{{title}}}
{{#if description}}Task Description: {{{description}}}{{/if}}
{{#if dueDate}}Task Due Date: {{{dueDate}}}{{else}}Task Due Date: Not specified{{/if}}

Provide your suggestion as a JSON object with "suggestedPriority" ("high", "medium", or "low") and a concise "reason" (1-2 sentences).
Example: { "suggestedPriority": "high", "reason": "The task is due tomorrow and mentions 'blocker'." }
`,
});

const suggestTaskPriorityFlow = ai.defineFlow(
  {
    name: 'suggestTaskPriorityFlow',
    inputSchema: SuggestTaskPriorityInputSchema,
    outputSchema: SuggestTaskPriorityOutputSchema,
  },
  async (input: SuggestTaskPriorityInput): Promise<SuggestTaskPriorityOutput> => {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 1000;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        if (output && output.suggestedPriority && output.reason) {
          return { suggestedPriority: output.suggestedPriority, reason: output.reason, error: undefined };
        } else {
          lastError = new Error("AI returned an empty, malformed, or non-conforming response for priority suggestion.");
          console.warn(`[suggestTaskPriorityFlow] Attempt ${attempts + 1}: ${lastError.message}`);
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error.message || error).toLowerCase();
        console.warn(`[suggestTaskPriorityFlow] Attempt ${attempts + 1} failed with error: ${errorMessage}`);

        if (errorMessage.includes('503') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('internal error') ||
            errorMessage.includes('timeout')) {
          // Retryable error
        } else {
          console.error(`[suggestTaskPriorityFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          // For non-retryable errors, return immediately with the error
          return { 
            suggestedPriority: 'medium', // Fallback
            reason: 'Could not determine priority due to a non-retryable AI error.',
            error: `AI Priority Suggestion Error: ${error.message || 'Unknown non-retryable error'}`
          };
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts - 1);
        console.log(`[suggestTaskPriorityFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalErrorMessage = `Failed to suggest task priority after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    console.warn(`[suggestTaskPriorityFlow] ${finalErrorMessage}`);
    return { 
      suggestedPriority: 'medium', // Fallback priority
      reason: 'Could not determine priority after several AI attempts.',
      error: finalErrorMessage 
    };
  }
);
