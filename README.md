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
        *   Storage

2.  **Configure Environment Variables:**
    *   In your Firebase project settings, find your web app's Firebase configuration (the `firebaseConfig` object).
    *   Create a `.env` file in the root of this Next.js project.
    *   Add your Firebase project's credentials to the `.env` file. It should look like this:

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

3.  **Security Rules:**
    *   **Firestore:** Set appropriate security rules for your Firestore database. For development, you might start with more open rules, but ensure they are secure for production.
        *Example (allow read/write if authenticated):*
        ```rules
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if request.auth != null;
            }
          }
        }
        ```
    *   **Storage:** Set security rules for Firebase Storage, especially for profile pictures.
        *Example (for profile pictures):*
        ```rules
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /profile-pictures/{userId}/{fileName} {
              allow read: if true; 
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
    *   Publish these rules in the Firebase console (Firestore -> Rules, and Storage -> Rules).

4.  **Authentication Email Templates:**
    *   In the Firebase console, go to Authentication -> Templates.
    *   Customize the email templates (e.g., Password Reset, Email Verification) to match your app's branding (e.g., change sender name from "kanvasai team" to "TaskGlide team").

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser to see the result.

To run Genkit flows locally for AI features (if configured):
```bash
npm run genkit:dev
```
This will start the Genkit development server, typically on port 3400.
```
