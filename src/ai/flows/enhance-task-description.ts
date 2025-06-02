
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
  enhancedDescription: z.string().describe('The enhanced description of the task. If an error occurred, this will be the original description.'),
  error: z.string().optional().describe('An error message if the operation failed after retries.'),
});
export type EnhanceTaskDescriptionOutput = z.infer<typeof EnhanceTaskDescriptionOutputSchema>;

export async function enhanceTaskDescription(input: EnhanceTaskDescriptionInput): Promise<EnhanceTaskDescriptionOutput> {
  return enhanceTaskDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceTaskDescriptionPrompt',
  input: {schema: EnhanceTaskDescriptionInputSchema},
  // The output schema for the prompt itself should only contain the success field.
  // The 'error' field in EnhanceTaskDescriptionOutputSchema is for the flow's wrapper.
  output: {schema: z.object({ enhancedDescription: z.string() })},
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
    const baseDelayMs = 1000;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);

        if (output && output.enhancedDescription) {
          return { enhancedDescription: output.enhancedDescription, error: undefined };
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
          // Retryable error
        } else {
          console.error(`[enhanceTaskDescriptionFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          throw error; // For non-retryable errors, we still throw
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts - 1);
        console.log(`[enhanceTaskDescriptionFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalErrorMessage = `Failed to enhance task description after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    const wasRetryableFailure = lastError && (
        String(lastError.message || lastError).toLowerCase().includes('503') ||
        String(lastError.message || lastError).toLowerCase().includes('overloaded') ||
        String(lastError.message || lastError).toLowerCase().includes('service unavailable') ||
        String(lastError.message || lastError).toLowerCase().includes('internal error') ||
        String(lastError.message || lastError).toLowerCase().includes('timeout') ||
        String(lastError.message || lastError).toLowerCase().includes('malformed response')
    );

    if (wasRetryableFailure) {
        console.warn(`[enhanceTaskDescriptionFlow] ${finalErrorMessage} (All retries exhausted for a potentially transient error)`);
        return { enhancedDescription: input.existingDescription, error: finalErrorMessage }; // Return original description and error
    } else {
        // This case should ideally be caught by the non-retryable throw above.
        // If it reaches here for a non-retryable error after loop, something is wrong.
        console.error(`[enhanceTaskDescriptionFlow] ${finalErrorMessage} (Non-retryable or unexpected final error)`);
        throw lastError || new Error(finalErrorMessage);
    }
  }
);
