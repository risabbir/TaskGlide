
// This file is used to start the Genkit development server locally (e.g., `npm run genkit:dev`).
// It imports 'dotenv' to load environment variables (like GOOGLE_API_KEY and Firebase config)
// from the .env file in your project root, making them available to your Genkit flows
// when run in this local development environment.
import { config } from 'dotenv';
config();

// Import all your Genkit flow definitions here so they are registered with Genkit.
import '@/ai/flows/suggest-task-tags.ts';
import '@/ai/flows/enhance-task-description.ts';
import '@/ai/flows/suggest-task-subtasks.ts';
import '@/ai/flows/suggest-focus-batch.ts';
import '@/ai/flows/suggest-task-priority.ts';
import '@/ai/flows/suggest-task-insights.ts'; // Added new flow
