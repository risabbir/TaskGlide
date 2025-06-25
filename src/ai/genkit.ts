
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Add logging to debug the API key on Vercel
const apiKey = process.env.GOOGLE_API_KEY;

if (apiKey && apiKey.length > 5) {
    // Log a confirmation that the key is found, showing only its length and last 4 chars for security
    console.log(`[Genkit Init] GOOGLE_API_KEY is set. Length: ${apiKey.length}, Ends with: ...${apiKey.slice(-4)}`);
} else if (apiKey) {
    // Log if the key is present but suspiciously short
    console.warn(`[Genkit Init] GOOGLE_API_KEY is present but seems very short. Length: ${apiKey.length}`);
} else {
    // Log a critical error if the key is missing entirely
    console.error('[Genkit Init] CRITICAL ERROR: GOOGLE_API_KEY environment variable was not found or is empty.');
}


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
