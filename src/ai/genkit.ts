import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Explicitly pass the API key from environment variables.
// This is more robust for production environments like Vercel.
// The `googleAI` plugin will use process.env.GOOGLE_API_KEY.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
