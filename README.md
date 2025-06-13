
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
        *   Firestore Database (Choose **Native mode**)
        *   Storage (You may need to upgrade to the Blaze plan - pay-as-you-go, but with a generous free tier - to enable Storage. You'll be prompted if this is necessary.)

2.  **Configure Environment Variables for Firebase:**
    *   In your Firebase project settings (Project Overview -> Project settings -> General tab, scroll down to "Your apps"), find your web app's Firebase configuration (the `firebaseConfig` object). If no web app exists, create one.
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
    *   **Replace `your_project_id_here` with your actual Firebase Project ID (e.g., `taskglide-app`). This is CRITICAL.**
    *   Replace the other placeholder values with your actual credentials from the `firebaseConfig` object.
    *   **Important:** After creating or modifying the `.env` file, you **must restart your Next.js development server** for the changes to take effect (`npm run dev`).

3.  **Enable Email/Password Sign-In Provider:**
    *   In the Firebase console, go to **Authentication** (Build menu) -> **Sign-in method** tab.
    *   Click on **Email/Password** in the list of providers.
    *   Enable the provider (toggle it on).
    *   Save the changes.

4.  **Authorize Domains for Authentication:**
    *   This is crucial for authentication flows, especially when using custom domains or during local development.
    *   In the Firebase console, go to **Authentication** (Build menu) -> **Settings** tab.
    *   Under the **Authorized domains** section, click **Add domain**.
    *   **For local development:** Add `localhost`. (e.g., if your app runs on `http://localhost:9002`, add `localhost`).
    *   **For deployed app:** Your Firebase Hosting domains (e.g., `your-project-id.web.app`, `your-project-id.firebaseapp.com`) are typically added automatically. However, if you encounter `auth/unauthorized-domain` errors, verify they are listed here. If deploying to a custom domain or another platform, you must add your live domain here.
    *   This step is critical to resolve `auth/unauthorized-domain` errors.

5.  **Security Rules (CRITICAL for Data Persistence):**
    *   **Firestore:** Set appropriate security rules for your Firestore database. Go to **Firestore Database** (Build menu) -> **Rules** tab in the Firebase console.
        *Replace the default rules with the following:*
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
    *   **Storage:** Set security rules for Firebase Storage, especially for profile pictures. Go to **Storage** (Build menu) -> **Rules** tab in the Firebase console.
        *Example (for profile pictures):*
        ```rules
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            // Allow public read for profile pictures, but only authenticated user can write to their own path.
            match /profile-pictures/{userId}/{fileName} {
              allow read: if true; // Or `if request.auth != null;` for private images
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
    *   **Publish these rules** in the Firebase console for both Firestore and Storage. Changes can take a few minutes to propagate.
    *   **If you still get PERMISSION_DENIED errors after setting these rules:** See the "Troubleshooting Authentication and Data Errors" section below, especially "CRITICAL: Firestore `PERMISSION_DENIED` Errors".

6.  **Authentication Email Templates:**
    *   In the Firebase console, go to Authentication (Build menu) -> Templates tab.
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
    *   Ensure the rules are **EXACTLY** as follows and have been **Published**:
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
    *   **Rule Explanation:** The rule `allow read, write: if request.auth != null && request.auth.uid == userId;` means that for a user to read or write a document in `userKanbanData/SOME_USER_ID`, they must be logged in (`request.auth != null`) AND their authenticated User ID (`request.auth.uid`) must be identical to `SOME_USER_ID`.

2.  **🔥🔥🔥 CRITICAL - Verify Correct Firebase Project ID Match 🔥🔥🔥**
    *   This is the **MOST COMMON CAUSE** of persistent `PERMISSION_DENIED` errors when rules *seem* correct.
    *   **Step A: Find Project ID in Firebase Console URL:**
        *   Go to your **Firebase Console**.
        *   Navigate to **Firestore Database -> Rules**.
        *   Look at the URL in your browser's address bar. It will be something like: `https://console.firebase.google.com/project/YOUR-PROJECT-ID-FROM-CONSOLE/firestore/rules`
        *   **Carefully copy `YOUR-PROJECT-ID-FROM-CONSOLE`**. (Example: if URL is `.../project/my-cool-app-123/firestore/...`, then `my-cool-app-123` is the ID).
    *   **Step B: Find Project ID in your `.env` file:**
        *   Open the `.env` file in the root of your Next.js project.
        *   Find the line `NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here`.
        *   Copy the value `your_project_id_here`.
    *   **Step C: Compare the two Project IDs.**
        *   **These two Project IDs MUST MATCH EXACTLY.** Case matters. No extra spaces.
        *   If they are different, your app is trying to connect to one Firebase project, but you are setting security rules in another. This *will* cause `PERMISSION_DENIED`.
        *   If they don't match, **update your `.env` file** to use the Project ID from the Firebase Console URL (Step A).
    *   **Step D: Restart your Next.js development server (`npm run dev`) after any changes to the `.env` file.** This is essential for the changes to take effect.
    *   **Console Log Check:** Your browser's developer console will show logs from `[KanbanService]` when it attempts Firestore operations. These logs include `Configured Project ID: ...`. This logged Project ID *must* match the Project ID from your Firebase Console URL (Step A).

3.  **User Authentication State & UID Verification:**
    *   The app's `AuthContext` and `KanbanProvider` output console logs about the user's authentication state (e.g., `[AuthContext] onAuthStateChanged: User signed IN. UID: ...`, `[KanbanProvider] Debounced Save TIMEOUT EXECUTING. AuthContext User: ..., SDK User: ...`).
    *   When you attempt an operation that fails with `PERMISSION_DENIED` (like saving a task for user `k2SQs3CKg4hbDJMz9MqBzYyJYB93`):
        *   Check your browser's developer console.
        *   The logs from `kanban-service.ts` (e.g., `[KanbanService] Attempting to SET doc to path: "userKanbanData/k2SQs3CKg4hbDJMz9MqBzYyJYB93" ...`) will show the exact path and Project ID the app is trying to use.
        *   The logs from `AuthContext` should show if the user (`k2SQs3CKg4hbDJMz9MqBzYyJYB93`) is correctly signed in from the app's perspective.
        *   Go to **Firebase Console -> Authentication -> Users tab**. Find the user with the UID `k2SQs3CKg4hbDJMz9MqBzYyJYB93`. Confirm this user exists and is enabled.
    *   If `request.auth` is `null` in the Firestore rules' context (meaning Firebase doesn't see an authenticated user for the request), or if `request.auth.uid` doesn't match the `{userId}` in the Firestore path (`k2SQs3CKg4hbDJMz9MqBzYyJYB93` in your case), access will be denied. The console logs should help identify if the app is trying to use an incorrect or null UID, or if it's communicating with an unintended Firebase project.

4.  **Use the Firestore Rules Simulator:**
    *   In the **Firebase Console -> Firestore Database -> Rules** tab, click on **"Rules Playground"** or **"Simulator"**.
    *   **Simulate a write operation:**
        *   **Type of operation:** Select "set" or "update".
        *   **Location (Path):** Enter the exact path your app is trying to write to (e.g., `userKanbanData/k2SQs3CKg4hbDJMz9MqBzYyJYB93`).
        *   **Authenticated:** Toggle this ON.
        *   **Authentication UID:** Enter the UID of the user you are testing with (e.g., `k2SQs3CKg4hbDJMz9MqBzYyJYB93`).
        *   (Optional) You can add mock document data if your rules depend on `resource.data`.
        *   Click "Run".
    *   The simulator will tell you if the operation is allowed or denied based on your *current published rules* and the simulated authentication state. If it's denied here, your rules are the problem or the UID you're testing with is incorrect.

5.  **Publish and Wait:**
    *   After updating rules in the Firebase Console, click "Publish".
    *   It might take a few minutes (sometimes up to 5-10 minutes, though usually faster) for rule changes to propagate globally. If you test immediately, you might still hit the old (or default) rules.

6.  **Firebase Project Billing (Blaze Plan):**
    *   While the free "Spark" plan is usually sufficient for development, if you are on the "Blaze" (pay-as-you-go) plan, ensure billing is active for your Google Cloud project associated with Firebase. Firestore operations might be restricted if billing fails, though this usually results in errors other than `PERMISSION_DENIED`.

By meticulously checking these steps, particularly the **Firebase Project ID match**, the **exact security rules**, and using the **Firestore Rules Simulator**, you should be able to resolve the `PERMISSION_DENIED` error.

### Font Loading Errors (403 Forbidden)

If you see console errors like `Failed to load resource: ... .woff2 ... status of 403 ()`, this typically means the server is forbidding access to these font files.
*   **Cause:** This is often due to environment-specific configurations, especially if using platforms like Cloud Workstations. It could be related to Content Security Policy (CSP) headers, proxy configurations, or network access rules on the server/platform hosting your development environment.
*   **Solution:** This is generally not an issue within the Next.js application code itself (as `geist` fonts are standard). You'll need to investigate the configuration of your hosting/development platform (e.g., Cloud Workstations settings, any intermediary proxies or firewalls).

### React Hydration Mismatch Errors (e.g., `bis_skin_checked="1"`)

If you see hydration errors mentioning unexpected attributes like `bis_skin_checked="1"`:
*   **Cause:** This is almost always caused by a **browser extension** (like Grammarly, Bitdefender Anti-tracker, or some accessibility tools) modifying the HTML of your page after the server renders it but before React fully hydrates on the client.
*   **Solution:**
    *   Try running your application in an **Incognito/Private Browsing window** (which usually disables extensions).
    *   Temporarily disable all browser extensions and see if the error disappears.
*   The application already uses `suppressHydrationWarning={true}` on root elements, which is the standard React way to handle such unavoidable discrepancies. No further application code changes can typically "fix" DOM modifications made by external browser extensions.

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
    
