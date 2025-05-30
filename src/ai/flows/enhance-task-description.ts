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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
