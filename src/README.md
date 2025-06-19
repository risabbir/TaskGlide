
# TaskGlide (Firebase Studio Project) - Guest Mode Version

This is a Next.js starter application for TaskGlide, built in Firebase Studio. It's designed as a personal task management tool and currently operates in **Guest-Only Mode**.

## Guest Mode Operation

In its current configuration, TaskGlide operates entirely in a guest mode:

*   **No User Accounts:** Sign-up and sign-in functionalities for registered users have been disabled.
*   **Local Data Storage:** All your task data (tasks, columns, etc.) is stored directly in your web browser's `localStorage`.
*   **Data Persistence:** Your data will remain in your browser as long as you don't clear your browser's cache, cookies, or site-specific data for TaskGlide. If you use a different browser, device, or a private/incognito window, your data will not be accessible there.
*   **Guest ID:** A unique Guest ID is generated and stored locally to manage your session. You can see this ID on the "Guest Info" page (accessible via the guest icon in the header/bottom navigation).
*   **Starting Fresh:** From the "Guest Info" page, you can choose to "Clear All Data & Start New Guest Session," which will wipe your locally stored tasks and begin a new empty session.

## Getting Started

To get started with the application:

1.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
2.  Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser.
3.  The application should prompt you to "Continue as Guest" or automatically start a guest session.

## AI Features (Optional Setup)

TaskGlide includes AI-powered features (like enhancing task descriptions, suggesting tags, etc.) which use Genkit with Google AI (Gemini models).

1.  **Get a Google AI API Key:**
    *   You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Alternatively, if you are using Google Cloud, you can create an API key in the Google Cloud Console. Ensure that the **"Generative Language API"** or **"Vertex AI API"** is enabled for the Google Cloud project associated with your API key.

2.  **Configure Environment Variable for API Key:**
    *   Create a file named `.env` in the **root directory** of this project (if it doesn't already exist).
    *   Add your Google AI API key to your `.env` file:
        ```env
        GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE
        ```
    *   Replace `YOUR_GOOGLE_AI_API_KEY_HERE` with the actual key you obtained.
    *   **Restart your Next.js development server** after creating or modifying the `.env` file for the changes to take effect.
    *   The Genkit `googleAI` plugin will automatically use this environment variable.

**Note:** Firebase Project ID and other Firebase-related environment variables (`NEXT_PUBLIC_FIREBASE_...`) are **no longer required** for the core task management functionality as it relies on local storage. However, if you intend to use Genkit's Firebase integration for other purposes in the future (not currently used by this version), you might need them. For AI features, only `GOOGLE_API_KEY` is essential.

## Troubleshooting Common Errors (General Web App Issues)

*   **Font Loading Errors (403 Forbidden):**
    If you see console errors like `Failed to load resource: ... .woff2 ... status of 403 ()`, this typically means the server is forbidding access to these font files. This is often due to environment-specific configurations, especially if using platforms like Cloud Workstations. Investigate the configuration of your hosting/development platform.
*   **React Hydration Mismatch Errors (e.g., `bis_skin_checked="1"`):**
    If you see hydration errors mentioning unexpected attributes like `bis_skin_checked="1"`: This is almost always caused by a **browser extension**. Test in an **Incognito/Private Browsing window** or temporarily disable browser extensions.

## Development

To run the development server for the Next.js application:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser.

To run Genkit flows locally for testing AI features (if `GOOGLE_API_KEY` is set up):
```bash
npm run genkit:dev
```
This starts the Genkit development server (usually port 3400), loading environment variables from `.env`.
