
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
    .describe('An array of suggested subtask titles (as strings).'),
});
export type SuggestTaskSubtasksOutput = z.infer<typeof SuggestTaskSubtasksOutputSchema>;

export async function suggestTaskSubtasks(input: SuggestTaskSubtasksInput): Promise<SuggestTaskSubtasksOutput> {
  return suggestTaskSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskSubtasksPrompt',
  input: {schema: SuggestTaskSubtasksInputSchema},
  output: {schema: SuggestTaskSubtasksOutputSchema},
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
  async input => {
    const {output} = await prompt(input);
    // Ensure output and output.subtasks are not null/undefined before returning
    if (output && output.subtasks) {
      return output;
    }
    // Fallback to an empty array if AI doesn't return expected structure
    return { subtasks: [] };
  }
);
