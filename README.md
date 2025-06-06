
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

3.  **Enable Sign-In Providers:**
    *   In the Firebase console, go to **Authentication** -> **Sign-in method**.
    *   **Email/Password:** Ensure this is enabled (it usually is by default if you selected Authentication during project setup).
    *   **Google:**
        *   Click on "Google" in the list of providers.
        *   Enable the provider.
        *   You **must** select a **Project support email**. If this is not set, Google Sign-In will fail.
        *   Save the changes.

4.  **Security Rules:**
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

5.  **Authentication Email Templates:**
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

## Troubleshooting Google Sign-In Errors

If you encounter errors specifically with Google Sign-In (e.g., "auth/operation-not-allowed", popup errors, or other "auth/..." codes):

1.  **Check Firebase Console Configuration:**
    *   Go to your Firebase Project -> Authentication -> Sign-in method.
    *   Ensure **Google** is **Enabled**.
    *   Crucially, make sure a **Project support email** is selected and saved for the Google provider. If it's empty, Google Sign-In will often fail.
2.  **Check Google Cloud Console (GCP) OAuth Consent Screen:**
    *   Firebase projects are typically linked to Google Cloud projects. Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Select the Google Cloud project that is associated with your Firebase project.
    *   Navigate to "APIs & Services" -> "OAuth consent screen".
    *   **Publishing status:** Ensure your OAuth consent screen is **Published**. If it's in "Testing," only explicitly listed test users can sign in. For general access, it must be published.
    *   **User type:** For most apps, this will be "External".
    *   **Authorized domains:** While `signInWithPopup` doesn't always strictly require this for `localhost`, ensure your app's actual domain (if deployed) is listed. For Firebase Hosting, it typically adds `your-project-id.firebaseapp.com` and `your-project-id.web.app` automatically when you set up the Google provider in Firebase.
    *   **Scopes:** The default Firebase scopes for Google Sign-In (`email`, `profile`, `openid`) are usually sufficient.
3.  **Check API Key Restrictions (if any):**
    *   In Google Cloud Console -> APIs & Services -> Credentials.
    *   Find the API key used by your web app (usually named "Browser key (auto created by Firebase)").
    *   If you have applied restrictions to this key:
        *   Ensure "Firebase Authentication API" is enabled under "API restrictions".
        *   Under "Application restrictions", ensure `*.firebaseapp.com` is allowed if using Firebase Hosting. For local development, you might need to add `http://localhost:<YOUR_PORT>` (e.g., `http://localhost:9002`).
4.  **Verify `.env` Variables:**
    *   Double-check that all `NEXT_PUBLIC_FIREBASE_...` variables in your `.env` file are correct and correspond to the Firebase project where you enabled Google Sign-In.
    *   **Restart your Next.js development server** (`npm run dev`) after any changes to `.env`.
5.  **Browser Issues:**
    *   Ensure your browser is not blocking pop-ups from `localhost` or your Firebase auth domain (`<YOUR_PROJECT_ID>.firebaseapp.com`).
    *   Try clearing your browser's cache and cookies for the site.
    *   Test in an incognito window to rule out extension conflicts.
6.  **Firebase Project Billing:**
    *   While basic Firebase Auth is free, ensure your Firebase project is in good standing (e.g., if linked to a GCP project, billing is active if you're using paid services, though Auth itself doesn't usually require this unless you hit high usage quotas not typical for development). This is a less common cause for basic auth issues but worth noting.

If errors persist after checking these, inspect the browser's developer console for more detailed error messages from Firebase, which often provide specific error codes (like `auth/operation-not-allowed`).


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
    
