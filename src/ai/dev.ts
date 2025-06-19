
// This file is used to start the Genkit development server locally (e.g., `npm run genkit:dev`).
// It imports 'dotenv' to load environment variables (like GOOGLE_API_KEY)
// from the .env file in your project root, making them available to your Genkit flows
// when run in this local development environment.
// For the AI features to work when testing Genkit flows locally, ensure GOOGLE_API_KEY is set in your .env file.
import { config } from 'dotenv';
config();

// Import all your Genkit flow definitions here so they are registered with Genkit.
import '@/ai/flows/suggest-task-tags.ts';
import '@/ai/flows/enhance-task-description.ts';
import '@/ai/flows/suggest-task-subtasks.ts';
import '@/ai/flows/suggest-focus-batch.ts';
import '@/ai/flows/suggest-task-priority.ts';
import '@/ai/flows/suggest-task-insights.ts'; // Added new flow
