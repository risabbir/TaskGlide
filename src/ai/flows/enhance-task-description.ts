
'use server';
/**
 * @fileOverview An AI agent that enhances a task description based on the task title.
 *
 * - enhanceTaskDescription - A function that enhances the task description.
 * - EnhanceTaskDescriptionInput - The input type for the enhanceTaskDescription function.
 * - EnhanceTaskDescriptionOutput - The return type for the enhanceTaskDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceTaskDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  existingDescription: z.string().describe('The existing description of the task.'),
});
export type EnhanceTaskDescriptionInput = z.infer<typeof EnhanceTaskDescriptionInputSchema>;

const EnhanceTaskDescriptionOutputSchema = z.object({
  enhancedDescription: z.string().describe('The enhanced description of the task.'),
});
export type EnhanceTaskDescriptionOutput = z.infer<typeof EnhanceTaskDescriptionOutputSchema>;

export async function enhanceTaskDescription(input: EnhanceTaskDescriptionInput): Promise<EnhanceTaskDescriptionOutput> {
  return enhanceTaskDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceTaskDescriptionPrompt',
  input: {schema: EnhanceTaskDescriptionInputSchema},
  output: {schema: EnhanceTaskDescriptionOutputSchema},
  prompt: `You are an AI assistant helping to refine task descriptions.
  Given the task title and the existing description, enhance the description to be more comprehensive.
  Title: {{{title}}}
  Existing Description: {{{existingDescription}}}
  Enhanced Description: `,
});

const enhanceTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'enhanceTaskDescriptionFlow',
    inputSchema: EnhanceTaskDescriptionInputSchema,
    outputSchema: EnhanceTaskDescriptionOutputSchema,
  },
  async (input: EnhanceTaskDescriptionInput): Promise<EnhanceTaskDescriptionOutput> => {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 1000; // Initial delay for retries
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input); // output is EnhanceTaskDescriptionOutput | undefined

        if (output && output.enhancedDescription) {
          return output; // Success
        } else {
          lastError = new Error("AI returned an empty or malformed response for description enhancement.");
          console.warn(`[enhanceTaskDescriptionFlow] Attempt ${attempts + 1}: ${lastError.message}`);
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error.message || error).toLowerCase();
        console.warn(`[enhanceTaskDescriptionFlow] Attempt ${attempts + 1} failed with error: ${errorMessage}`);

        if (errorMessage.includes('503') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('internal error') ||
            errorMessage.includes('timeout')) {
          // Retryable error, loop will continue
        } else {
          // Non-retryable error
          console.error(`[enhanceTaskDescriptionFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          throw error; // Immediately throw non-retryable errors
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts - 1); // Exponential backoff: 1s, 2s
        console.log(`[enhanceTaskDescriptionFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If loop finishes, all attempts failed for retryable errors.
    const finalErrorMessage = `Failed to enhance task description after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    console.error(`[enhanceTaskDescriptionFlow] ${finalErrorMessage}`);
    throw lastError || new Error(finalErrorMessage); // Re-throw the last encountered error or a generic one
  }
);
