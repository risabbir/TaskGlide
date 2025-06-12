
# TaskGlide (Firebase Studio Project)

This is a Next.js starter application for TaskGlide, built in Firebase Studio.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

## Firebase Setup

This application uses Firebase for backend services including Authentication, Firestore, and Storage.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Create a new project. If you desire a specific Project ID (e.g., `taskglide-app`), ensure it's available and set it during project creation. Remember, Project IDs are immutable.
    *   Enable the following services in your Firebase project:
        *   Authentication (with Email/Password sign-in method)
        *   Firestore Database
        *   Storage (You may need to upgrade to the Blaze plan - pay-as-you-go, but with a generous free tier - to enable Storage. You'll be prompted if this is necessary.)

2.  **Configure Environment Variables for Firebase:**
    *   In your Firebase project settings, find your web app's Firebase configuration (the `firebaseConfig` object).
    *   Create a `.env` file in the root of this Next.js project if it doesn't exist.
    *   Add your Firebase project's credentials to the `.env` file. It should look like this (replace placeholders with your actual values):

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here (optional)
    ```
    *   **Replace `your_project_id_here` with your actual Firebase Project ID (e.g., `taskglide-app`).**
    *   Replace the other placeholder values with your actual credentials.
    *   **Important:** After creating or modifying the `.env` file, you **must restart your Next.js development server** for the changes to take effect (`npm run dev`).

3.  **Enable Email/Password Sign-In Provider:**
    *   In the Firebase console, go to **Authentication** -> **Sign-in method**.
    *   **Email/Password:** Ensure this is enabled (it usually is by default if you selected Authentication during project setup).
    *   Save the changes.

4.  **Authorize Domains for Authentication:**
    *   This is crucial for authentication flows, especially when using custom domains or during local development.
    *   In the Firebase console, go to **Authentication** -> **Settings** tab.
    *   Under the **Authorized domains** section, click **Add domain**.
    *   **For local development:** Add `localhost`. (e.g., if your app runs on `http://localhost:9002`, add `localhost`).
    *   **For deployed app:** Your Firebase Hosting domains (e.g., `your-project-id.web.app`, `your-project-id.firebaseapp.com`) are typically added automatically. However, if you encounter `auth/unauthorized-domain` errors, verify they are listed here. If deploying to a custom domain or another platform, you must add your live domain here.
    *   This step is critical to resolve `auth/unauthorized-domain` errors.

5.  **Security Rules:**
    *   **Firestore:** Set appropriate security rules for your Firestore database. Go to Firestore Database -> Rules in the Firebase console.
        *Example (allow read/write if authenticated for specific paths):*
        ```rules
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow access to user-specific kanban data and profile data if authenticated
            match /userKanbanData/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            match /profiles/{userId} {
              allow read: if request.auth != null; // Or more restrictive if needed
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
    *   **Storage:** Set security rules for Firebase Storage, especially for profile pictures. Go to Storage -> Rules in the Firebase console.
        *Example (for profile pictures):*
        ```rules
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /profile-pictures/{userId}/{fileName} {
              allow read: if true; // Or if request.auth != null for private images
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
    *   Publish these rules in the Firebase console (Firestore -> Rules, and Storage -> Rules).

6.  **Authentication Email Templates:**
    *   In the Firebase console, go to Authentication -> Templates.
    *   Customize the email templates (e.g., Password Reset, Email Verification) to match your app's branding (e.g., change sender name from the default to "TaskGlide team").

## AI Features Setup (Genkit with Google AI)

This application uses Genkit to power its AI features (like suggesting task details, tags, subtasks, and focus batches) via Google AI (Gemini models).

1.  **Get a Google AI API Key:**
    *   You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Alternatively, if you are using Google Cloud, you can create an API key in the Google Cloud Console. Ensure that the **"Generative Language API"** or **"Vertex AI API"** is enabled for the Google Cloud project associated with your API key.

2.  **Configure Environment Variable for API Key:**
    *   Add your Google AI API key to your `.env` file:
    ```env
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE
    ```
    *   Replace `YOUR_GOOGLE_AI_API_KEY_HERE` with the actual key you obtained.
    *   Restart your Next.js development server if it was running.
    *   The Genkit `googleAI` plugin will automatically use this environment variable.

## Troubleshooting Authentication Errors

If you encounter errors with Email/Password Sign-In or other authentication flows (e.g., `auth/unauthorized-domain`, `auth/network-request-failed`, or other "auth/..." codes):

1.  **`auth/unauthorized-domain` Error (Even if `localhost` is added):**
    *   This is the most common issue. If you've already added `localhost` to **Firebase Console -> Authentication -> Settings -> Authorized domains** and still see this error, double-check:
        *   **Correct Project:** Ensure the Firebase project you're configuring is the same one whose credentials are in your `.env` file.
        *   **Typo:** Ensure `localhost` is spelled correctly.
        *   **Browser Cache/Incognito:** Try clearing your browser cache for `localhost` or testing in an Incognito/Private window.
        *   **Firewall/VPN:** Rarely, network configurations might interfere.

2.  **`auth/network-request-failed` or Other Network Issues:**
    *   Check your internet connection.
    *   Ensure Firebase services are not experiencing an outage (check the [Firebase Status Dashboard](https://status.firebase.google.com/)).
    *   If using a VPN or proxy, try disabling it temporarily.
    *   Ad blockers or browser extensions can sometimes interfere with network requests to Firebase. Try disabling them.

3.  **Check Firebase Console Configuration (General):**
    *   Go to your Firebase Project -> Authentication -> Sign-in method.
    *   Ensure **Email/Password** provider is **Enabled**.

4.  **Verify `.env` Variables & Restart Server:**
    *   Double-check that all `NEXT_PUBLIC_FIREBASE_...` variables in your `.env` file are correct and correspond to the Firebase project where you enabled the sign-in methods and authorized `localhost`.
    *   **Crucially, restart your Next.js development server** (`npm run dev`) after any changes to `.env`.

5.  **Firebase Project Billing:**
    *   While basic Firebase Auth is free, ensure your Firebase project is in good standing (e.g., if linked to a GCP project, billing is active if you're using paid services beyond the free tier). Unlikely to cause basic auth errors directly but worth a check.

If errors persist after checking these, inspect the browser's developer console for more detailed error messages from Firebase, which often provide specific error codes beyond the general one you see.


## Development

To run the development server for the Next.js application:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser to see the result.

To run Genkit flows locally for testing AI features:
```bash
npm run genkit:dev
```
This will start the Genkit development server, typically on port 3400. It uses `dotenv` to load environment variables (like `GOOGLE_API_KEY` and Firebase credentials) from your `.env` file.

## Data Migration (If switching Firebase projects)

If you have switched from an old Firebase project to a new one (e.g., from "kanvasai" to "taskglide-app"):

*   **Authentication Users:** You need to migrate users. Use the Firebase CLI:
    *   Export from old project: `firebase auth:export users.json --project OLD_PROJECT_ID`
    *   Import to new project: `firebase auth:import users.json --project NEW_PROJECT_ID --hash-algo=SCRYPT --rounds=8 --mem-cost=14` (adjust hash parameters if your old project used different ones).
*   **Firestore Data:** Export data from the old Firestore (via Firebase Console or `gcloud firestore export`) and import it into the new one (`gcloud firestore import`).
*   **Storage Files:** Manually download/upload or use `gsutil` to transfer files between buckets.

Remember to update security rules and email templates in the new Firebase project as well.

    