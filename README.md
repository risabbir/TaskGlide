
# TaskGlide (Firebase Studio Project)

This is a Next.js starter application for TaskGlide, built in Firebase Studio. It's designed as a personal task management tool.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

## Firebase Setup: Essential Steps for Personal Use

This application uses Firebase for backend services including Authentication, Firestore (for saving your tasks if you register), and optionally Storage (for profile pictures). Genkit with Google AI is used for AI features.

**You MUST complete these steps for the application to function correctly, especially for registered users to save their data.**

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the prompts. Choose a Project name (e.g., "My TaskGlide App").
    *   Your Firebase Project ID will be assigned by Firebase (e.g., `mytaskglide`, `my-cool-app-123`). You can find this in Project Settings or in the URL of your Firebase console.
    *   Enable or disable Google Analytics as you prefer (not essential for app functionality).

2.  **Configure Environment Variables for Firebase (CRITICAL):**
    *   In your new Firebase project, go to **Project settings** (click the gear icon ⚙️ next to "Project Overview" in the top left).
    *   In the **General** tab, scroll down to "Your apps."
    *   Click the Web icon (`</>`) to register a new web app.
        *   Give it a nickname (e.g., "TaskGlide Web").
        *   Firebase Hosting is optional for now; you can skip it.
    *   After registering, Firebase will show you a `firebaseConfig` object. **These are your app's credentials.**
    *   Create a file named `.env` in the **root directory** of this Next.js project (if it doesn't already exist).
    *   Copy the following structure into your `.env` file and replace the placeholders with your *actual* values from the `firebaseConfig` object:

        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=mytaskglide  # <-- REPLACE 'mytaskglide' WITH YOUR ACTUAL FIREBASE PROJECT ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
        # NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here (optional, for Analytics)

        # For AI Features (Genkit with Google AI)
        GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE
        ```
    *   **🔥🔥🔥 CRITICAL: `NEXT_PUBLIC_FIREBASE_PROJECT_ID` must be your actual Firebase Project ID.** For example, if your Project ID is `mytaskglide`, the line should be `NEXT_PUBLIC_FIREBASE_PROJECT_ID=mytaskglide`. This is the most common source of `PERMISSION_DENIED` errors if mismatched. Find your Project ID in the Firebase Console URL (e.g., `console.firebase.google.com/project/YOUR-PROJECT-ID/`) or in Project Settings.
    *   **Restart your Next.js development server (`npm run dev`)** after creating or modifying the `.env` file. This is essential for the changes to take effect.

3.  **Enable Firebase Services:**
    *   **Authentication:**
        *   In the Firebase Console, go to **Authentication** (Build menu).
        *   Click "Get started."
        *   On the **Sign-in method** tab, click on **Email/Password** in the list of providers.
        *   **Enable** the provider (toggle it on) and click Save.
        *   On the **Settings** tab (still in Authentication), under **Authorized domains**, click **Add domain** and add `localhost`. This is crucial for local development. (Your Firebase Hosting domains are usually added automatically if you set up hosting).
    *   **Firestore Database (for saving tasks):**
        *   In the Firebase Console, go to **Firestore Database** (Build menu).
        *   Click "Create database."
        *   Choose **Start in production mode** or **Start in test mode**. For personal use and to get started quickly, test mode is okay, but **you MUST secure your rules later if you ever share the app or put real data in it.** Production mode is safer as it denies all access by default.
        *   Select a Firestore location (choose one close to you).
        *   **CRITICAL - Firestore Security Rules:** Go to the **Rules** tab within Firestore Database. Replace the existing rules with the following:
            ```rules
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                // Allow a user to read and write their own kanban data document.
                // The document ID {userId} must match the authenticated user's UID.
                match /userKanbanData/{userId} {
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                }
                // Allow a user to read and write their own profile document.
                match /profiles/{userId} {
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                }
              }
            }
            ```
        *   Click **Publish**. Changes can take a few minutes to propagate. **If you get `PERMISSION_DENIED` errors when saving tasks as a registered user, this (or a Project ID mismatch in `.env`) is almost always the cause.**

4.  **AI Features Setup (Genkit with Google AI):**
    *   You'll need a Google AI API key to use the AI-powered features (task suggestions, etc.).
    *   Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Add this key to your `.env` file as `GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE`.
    *   Restart your Next.js dev server.
    *   **Note:** Ensure the "Generative Language API" or "Vertex AI API" is enabled for the Google Cloud project associated with your API key if you created it via Google Cloud Console.

## Firebase Setup: Optional Steps

*   **Firebase Storage (for Profile Pictures):**
    *   This feature allows users to upload profile pictures.
    *   **IMPORTANT:** Enabling Firebase Storage might require you to upgrade your Firebase project to the **Blaze (pay-as-you-go) billing plan**. While the Blaze plan has a generous free tier, usage beyond that will incur costs.
    *   **If you cannot or do not want to upgrade your billing plan, you can skip setting up Storage.** The application will disable profile picture functionality gracefully.
    *   To enable:
        *   In the Firebase Console, go to **Storage** (Build menu).
        *   Click "Get started" and follow the prompts.
        *   Go to the **Rules** tab for Storage and set rules. Example for profile pictures:
            ```rules
            rules_version = '2';
            service firebase.storage {
              match /b/{bucket}/o {
                match /profile-pictures/{userId}/{fileName} {
                  allow read: if true; // Or `if request.auth != null;` for private images
                  allow write: if request.auth != null && request.auth.uid == userId;
                }
              }
            }
            ```
        *   Click **Publish**.
*   **Customize Authentication Email Templates:**
    *   In the Firebase Console, go to **Authentication** (Build menu) -> **Templates** tab.
    *   You can customize the sender name, reply-to email, and the content of emails for password reset, email verification, etc. This is cosmetic and not essential for functionality.

## Troubleshooting Common Errors

### Common Authentication Errors (`auth/...`)

*   **`auth/unauthorized-domain`:**
    *   Ensure `localhost` (for development) and your production domain are listed in **Firebase Console -> Authentication -> Settings -> Authorized domains**.
    *   Check your **Google Cloud Console -> APIs & Services -> OAuth consent screen**. Ensure the "Publishing status" is **"Published"**.
*   **`auth/operation-not-allowed` (for Email/Password):**
    *   Ensure the **Email/Password** provider is **Enabled** in **Firebase Console -> Authentication -> Sign-in method**.
*   **`auth/network-request-failed`:**
    *   Check your internet connection.
    *   Verify Firebase services are not down ([Firebase Status Dashboard](https://status.firebase.google.com/)).
    *   Browser extensions (ad blockers) or VPNs might interfere.
*   **General:**
    *   Confirm `.env` variables (`NEXT_PUBLIC_FIREBASE_...`) are correct for the Firebase project you're configuring.
    *   **Restart your Next.js dev server** after any `.env` changes.
    *   Check browser console for more detailed Firebase error messages.

### ⚠️ CRITICAL: Firestore `PERMISSION_DENIED` Errors (Data not saving/loading for registered users) ⚠️

This is almost always due to **Firestore Security Rules** configuration or a **mismatch between your app's Firebase project configuration and the Firebase project where you're setting the rules**.

1.  **Verify Rules:**
    *   Go to your **Firebase Console -> Firestore Database -> Rules** tab.
    *   Ensure the rules are **EXACTLY** as specified in "Essential Step 3" above and have been **Published**.
    *   **Rule Explanation:** The rule `allow read, write: if request.auth != null && request.auth.uid == userId;` means that for a user to read or write a document in `userKanbanData/SOME_USER_ID`, they must be logged in (`request.auth != null`) AND their authenticated User ID (`request.auth.uid`) must be identical to `SOME_USER_ID`.

2.  **🔥🔥🔥 CRITICAL - Verify Correct Firebase Project ID Match 🔥🔥🔥**
    *   This is the **MOST COMMON CAUSE** of persistent `PERMISSION_DENIED` errors when rules *seem* correct.
    *   **Step A: Find Project ID in Firebase Console URL:**
        *   Go to your **Firebase Console**.
        *   Navigate to **Firestore Database -> Rules**.
        *   Look at the URL in your browser's address bar. It will be something like: `https://console.firebase.google.com/project/YOUR-PROJECT-ID-FROM-CONSOLE/firestore/rules`
        *   **Carefully copy `YOUR-PROJECT-ID-FROM-CONSOLE`**. (Example: if URL is `.../project/mytaskglide/firestore/...`, then `mytaskglide` is the ID).
    *   **Step B: Find Project ID in your `.env` file AND in the app's Profile Page:**
        *   Open the `.env` file in the root of your Next.js project.
        *   Find the line `NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here`.
        *   Copy the value `your_project_id_here`. (For example, it should be `mytaskglide` if that is your Project ID).
        *   As a logged-in user, navigate to the Profile page in your application. It now displays the "Configured Firebase Project ID" the app is using.
    *   **Step C: Compare the three Project IDs.**
        *   The Project ID from the **Firebase Console URL (Step A)** (e.g., `mytaskglide`)
        *   The Project ID from your **`.env` file (Step B)** (e.g., should be `mytaskglide`)
        *   The Project ID displayed on your **app's Profile Page (Step B)** (e.g., should be `mytaskglide`)
        *   **These three Project IDs MUST MATCH EXACTLY.** Case matters. No extra spaces.
        *   If they are different, your app is trying to connect to one Firebase project, but you are setting security rules in another. This *will* cause `PERMISSION_DENIED`.
        *   If they don't match, **update your `.env` file** to use the Project ID from the Firebase Console URL (Step A). (e.g., `NEXT_PUBLIC_FIREBASE_PROJECT_ID=mytaskglide`).
    *   **Step D: Restart your Next.js development server (`npm run dev`) after any changes to the `.env` file.** This is essential for the changes to take effect.
    *   **Console Log Check:** Your browser's developer console will show logs from `[KanbanService]` when it attempts Firestore operations. These logs include `Configured Project ID: ...`. This logged Project ID *must* match the Project ID from your Firebase Console URL (Step A).

3.  **User Authentication State & UID Verification:**
    *   The app's `AuthContext` and `KanbanProvider` output console logs about the user's authentication state.
    *   When you attempt an operation that fails with `PERMISSION_DENIED`:
        *   Check your browser's developer console.
        *   The logs from `kanban-service.ts` will show the exact path and Project ID the app is trying to use.
        *   The logs from `AuthContext` should show if the user is correctly signed in from the app's perspective.
        *   Go to **Firebase Console -> Authentication -> Users tab**. Find the user by UID. Confirm this user exists and is enabled.
    *   If `request.auth` is `null` in the Firestore rules' context (meaning Firebase doesn't see an authenticated user for the request), or if `request.auth.uid` doesn't match the `{userId}` in the Firestore path, access will be denied.

4.  **Use the Firestore Rules Simulator:**
    *   In the **Firebase Console -> Firestore Database -> Rules** tab, click on **"Rules Playground"** or **"Simulator"**.
    *   **Simulate a write operation:**
        *   **Type of operation:** Select "set" or "update".
        *   **Location (Path):** Enter the exact path your app is trying to write to (e.g., `userKanbanData/YOUR_USER_ID`).
        *   **Authenticated:** Toggle this ON.
        *   **Authentication UID:** Enter the UID of the user you are testing with.
        *   Click "Run".
    *   The simulator will tell you if the operation is allowed or denied. If it's denied here, your rules are the problem or the UID you're testing with is incorrect.

5.  **Publish and Wait:**
    *   After updating rules in the Firebase Console, click "Publish".
    *   It might take a few minutes for rule changes to propagate globally.

6.  **Firebase Project Billing (Blaze Plan - generally not needed for Firestore basic use):**
    *   While the free "Spark" plan is usually sufficient for Firestore development, ensure your Google Cloud project associated with Firebase is in good standing if you are on Blaze. Firestore operations might be restricted if billing fails, though this usually results in errors other than `PERMISSION_DENIED`.

By meticulously checking these steps, particularly the **Firebase Project ID match**, the **exact security rules**, and using the **Firestore Rules Simulator**, you should be able to resolve the `PERMISSION_DENIED` error.

### Font Loading Errors (403 Forbidden)

If you see console errors like `Failed to load resource: ... .woff2 ... status of 403 ()`, this typically means the server is forbidding access to these font files.
*   **Cause:** This is often due to environment-specific configurations, especially if using platforms like Cloud Workstations.
*   **Solution:** Investigate the configuration of your hosting/development platform.

### React Hydration Mismatch Errors (e.g., `bis_skin_checked="1"`)

If you see hydration errors mentioning unexpected attributes like `bis_skin_checked="1"`:
*   **Cause:** This is almost always caused by a **browser extension**.
*   **Solution:** Test in an **Incognito/Private Browsing window** or temporarily disable browser extensions.

## Development

To run the development server for the Next.js application:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser.

To run Genkit flows locally for testing AI features:
```bash
npm run genkit:dev
```
This starts the Genkit development server (usually port 3400), loading environment variables from `.env`.

## Data Migration (If switching Firebase projects)

If you switch Firebase projects, you'll need to migrate data:
*   **Authentication Users:** Use Firebase CLI (`auth:export`, `auth:import`).
*   **Firestore Data:** Export/Import via Firebase Console or `gcloud firestore`.
*   **Storage Files:** Manual download/upload or `gsutil`.
Remember to update security rules and email templates in the new project.


      