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
    .describe('An array of suggested tags based on the task title and description.'),
});
export type SuggestTaskTagsOutput = z.infer<typeof SuggestTaskTagsOutputSchema>;

export async function suggestTaskTags(input: SuggestTaskTagsInput): Promise<SuggestTaskTagsOutput> {
  return suggestTaskTagsFlow(input);
}

const suggestTaskTagsPrompt = ai.definePrompt({
  name: 'suggestTaskTagsPrompt',
  input: {schema: SuggestTaskTagsInputSchema},
  output: {schema: SuggestTaskTagsOutputSchema},
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
  async input => {
    const {output} = await suggestTaskTagsPrompt(input);
    return output!;
  }
);
