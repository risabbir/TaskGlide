
'use server';
/**
 * @fileOverview AI-powered tag suggestion flow for task categorization.
 *
 * - suggestTaskTags - A function that suggests tags for a given task title and description.
 * - SuggestTaskTagsInput - The input type for the suggestTaskTags function.
 * - SuggestTaskTagsOutput - The return type for the suggestTaskTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskTagsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('The description of the task.'),
});
export type SuggestTaskTagsInput = z.infer<typeof SuggestTaskTagsInputSchema>;

const SuggestTaskTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags. Empty if an error occurred.'),
  error: z.string().optional().describe('An error message if the operation failed after retries.'),
});
export type SuggestTaskTagsOutput = z.infer<typeof SuggestTaskTagsOutputSchema>;

export async function suggestTaskTags(input: SuggestTaskTagsInput): Promise<SuggestTaskTagsOutput> {
  return suggestTaskTagsFlow(input);
}

const suggestTaskTagsPrompt = ai.definePrompt({
  name: 'suggestTaskTagsPrompt',
  input: {schema: SuggestTaskTagsInputSchema},
  output: {schema: z.object({ tags: z.array(z.string()) })}, // Prompt output is just the tags
  prompt: `You are a task management assistant. Your task is to suggest relevant tags for a given task based on its title and description.

Task Title: {{{title}}}
Task Description: {{{description}}}

Suggest at least 3 relevant tags for the task. Return them as a JSON array of strings.`,
});

const suggestTaskTagsFlow = ai.defineFlow(
  {
    name: 'suggestTaskTagsFlow',
    inputSchema: SuggestTaskTagsInputSchema,
    outputSchema: SuggestTaskTagsOutputSchema,
  },
  async (input: SuggestTaskTagsInput): Promise<SuggestTaskTagsOutput> => {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 1000;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await suggestTaskTagsPrompt(input);
        if (output && output.tags) {
          return { tags: output.tags, error: undefined };
        } else {
          lastError = new Error("AI returned an empty or malformed response for tag suggestions.");
          console.warn(`[suggestTaskTagsFlow] Attempt ${attempts + 1}: ${lastError.message}`);
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error.message || error).toLowerCase();
        console.warn(`[suggestTaskTagsFlow] Attempt ${attempts + 1} failed with error: ${errorMessage}`);

        if (errorMessage.includes('503') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('internal error') ||
            errorMessage.includes('timeout')) {
          // Retryable error
        } else {
          console.error(`[suggestTaskTagsFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          return {
            tags: [],
            error: `AI Tag Suggestion Error: ${error.message || 'Unknown non-retryable error'}`
          };
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts - 1);
        console.log(`[suggestTaskTagsFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalErrorMessage = `Failed to suggest task tags after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    console.warn(`[suggestTaskTagsFlow] ${finalErrorMessage}`);
    return { 
        tags: [], 
        error: finalErrorMessage 
    };
  }
);
