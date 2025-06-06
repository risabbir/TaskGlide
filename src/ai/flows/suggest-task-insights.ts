
'use server';
/**
 * @fileOverview An AI agent that provides insights and suggestions for a given task.
 *
 * - suggestTaskInsights - A function that provides insights for a task.
 * - SuggestTaskInsightsInput - The input type for the suggestTaskInsights function.
 * - SuggestTaskInsightsOutput - The return type for the suggestTaskInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Priority } from '@/lib/types'; // Assuming Priority type is available

const SuggestTaskInsightsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  priority: z.custom<Priority>().describe('The priority of the task (high, medium, or low).'),
  dueDate: z.string().optional().describe('The due date of the task in ISO string format (e.g., YYYY-MM-DD), if available.'),
  subtaskCount: z.number().describe('The number of subtasks associated with this task.'),
  tagCount: z.number().describe('The number of tags associated with this task.'),
  dependencyCount: z.number().describe('The number of dependencies (prerequisites) this task has.'),
  status: z.string().describe('The current status (column name) of the task, e.g., To Do, In Progress.'),
});
export type SuggestTaskInsightsInput = z.infer<typeof SuggestTaskInsightsInputSchema>;

const SuggestTaskInsightsOutputSchema = z.object({
  insights: z.array(z.string()).describe('An array of 2-4 concise (1-2 sentence) insights or actionable suggestions about the task. Empty if an error occurred.'),
  error: z.string().optional().describe('An error message if the operation failed after retries.'),
});
export type SuggestTaskInsightsOutput = z.infer<typeof SuggestTaskInsightsOutputSchema>;

export async function suggestTaskInsights(input: SuggestTaskInsightsInput): Promise<SuggestTaskInsightsOutput> {
  return suggestTaskInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskInsightsPrompt',
  input: {schema: SuggestTaskInsightsInputSchema},
  output: {schema: z.object({ insights: z.array(z.string()) })}, // Prompt output is just the insights
  prompt: `You are a helpful and concise productivity assistant. Your goal is to analyze the provided task details and offer 2-4 brief (1-2 sentences each), actionable insights or suggestions to help the user improve or manage this task effectively. Focus on clarity, actionability, completeness, potential risks, or opportunities.

Consider the following aspects:
- Clarity: Is the title clear and actionable? Is the description sufficient?
- Breakdown: Based on the title/description, does the subtask count seem appropriate? Could it be broken down further or are there too many for a simple task?
- Urgency/Priority: Does the priority align with the due date (if any)? If it's high priority with no due date, is that intended?
- Completeness: Could adding tags or identifying dependencies improve organization or planning?
- Status Alignment: Does the current status make sense given other details (e.g., a 'To Do' task with many completed subtasks)?

Today's Date for reference: ${new Date().toISOString().split('T')[0]}

Task Details:
- Title: {{{title}}}
- Description: {{#if description}}{{{description}}}{{else}}Not provided.{{/if}}
- Priority: {{{priority}}}
- Due Date: {{#if dueDate}}{{{dueDate}}}{{else}}Not set.{{/if}}
- Subtask Count: {{{subtaskCount}}}
- Tag Count: {{{tagCount}}}
- Dependency Count: {{{dependencyCount}}}
- Current Status: {{{status}}}

Please provide your insights as a JSON array of strings.
Example: { "insights": ["Consider adding a due date to this high-priority task to ensure timely completion.", "The description is a bit vague; adding more specific details could improve clarity."] }
If the task seems well-defined and no obvious suggestions arise, you can state that, e.g., "This task appears well-structured." or provide general encouragement.
Do not provide more than 4 insights. Be concise.
`,
});

const suggestTaskInsightsFlow = ai.defineFlow(
  {
    name: 'suggestTaskInsightsFlow',
    inputSchema: SuggestTaskInsightsInputSchema,
    outputSchema: SuggestTaskInsightsOutputSchema,
  },
  async (input: SuggestTaskInsightsInput): Promise<SuggestTaskInsightsOutput> => {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelayMs = 1000;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        if (output && output.insights) {
          // Ensure insights are not empty strings and limit count.
          const validInsights = output.insights.filter(insight => insight.trim() !== "").slice(0, 4);
          if (validInsights.length > 0) {
            return { insights: validInsights, error: undefined };
          } else if (output.insights.length === 0) { // AI explicitly returned no insights
            return { insights: ["The AI found no specific insights for this task at the moment."], error: undefined };
          }
          // If insights were present but all were empty strings after filtering
          lastError = new Error("AI returned empty insights.");

        } else {
          lastError = new Error("AI returned an empty or malformed response for task insights.");
        }
        console.warn(`[suggestTaskInsightsFlow] Attempt ${attempts + 1}: ${lastError.message}`);
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error.message || error).toLowerCase();
        console.warn(`[suggestTaskInsightsFlow] Attempt ${attempts + 1} failed with error: ${errorMessage}`);

        if (errorMessage.includes('503') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('internal error') ||
            errorMessage.includes('timeout')) {
          // Retryable error
        } else {
          console.error(`[suggestTaskInsightsFlow] Non-retryable error encountered on attempt ${attempts + 1}:`, error);
          // For non-retryable errors, return immediately with the error
          return { 
            insights: [],
            error: `AI Task Insights Error: ${error.message || 'Unknown non-retryable error'}`
          };
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempts - 1);
        console.log(`[suggestTaskInsightsFlow] Retrying in ${delay / 1000}s (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalErrorMessage = `Failed to get task insights after ${maxAttempts} attempts. Last error: ${lastError?.message || String(lastError) || 'Unknown error'}`;
    console.warn(`[suggestTaskInsightsFlow] ${finalErrorMessage}`);
    return { 
      insights: [],
      error: finalErrorMessage 
    };
  }
);
