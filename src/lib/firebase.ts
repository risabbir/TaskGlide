
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Renamed import

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Enhanced diagnostic check
const missingVars: string[] = [];
if (!firebaseConfig.apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

if (missingVars.length > 0) {
  const errorMessage =
    `[Firebase Lib] CRITICAL: Essential Firebase configuration is missing or incomplete. ` +
    `The following variables were not found or are empty: ${missingVars.join(', ')}. ` +
    'Please ensure they are correctly set in your .env file (located at the project root) ' +
    'and that your Next.js development server has been **restarted** after any changes to the .env file.';
  console.error(errorMessage); // Logs to server console (during SSR/build) and browser console
  // It's often better to let Firebase SDK throw its specific error if critical config is missing,
  // as it might provide more context, rather than throwing a custom error here.
} else {
  // Log the non-sensitive parts of the config being used if all critical vars are present
  // This will log on both server and client, wherever this module is imported.
  console.log("[Firebase Lib] Firebase Config to be used by initializeApp (Partial for Security):");
  console.log("[Firebase Lib] Auth Domain:", firebaseConfig.authDomain);
  console.log("[Firebase Lib] Project ID:", firebaseConfig.projectId);
  console.log("[Firebase Lib] Storage Bucket:", firebaseConfig.storageBucket);
  console.log("[Firebase Lib] Messaging Sender ID:", firebaseConfig.messagingSenderId);
  console.log("[Firebase Lib] App ID:", firebaseConfig.appId);
  console.log("[Firebase Lib] Measurement ID:", firebaseConfig.measurementId);
  if (firebaseConfig.apiKey) {
    console.log("[Firebase Lib] API Key: PRESENT (value not logged for security)");
  } else {
    // This case should be caught by missingVars check, but as a safeguard:
    console.error("[Firebase Lib] CRITICAL: API Key is MISSING from config for initializeApp!");
  }
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storageInstance: FirebaseStorage; // Renamed to avoid conflict

if (getApps().length === 0) {
  // Only initialize if no apps exist
  try {
    console.log("[Firebase Lib] Attempting to initialize Firebase app with provided config...");
    app = initializeApp(firebaseConfig);
    console.log("[Firebase Lib] Firebase app initialized successfully.");
  } catch (initError) {
    console.error("[Firebase Lib] CRITICAL ERROR during Firebase initializeApp:", initError);
    console.error("[Firebase Lib] The config used for initializeApp (excluding API_KEY) was:", {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: firebaseConfig.measurementId,
    });
    // Re-throw the error to make it very clear initialization failed.
    throw initError;
  }
} else {
  app = getApps()[0]!;
  console.log("[Firebase Lib] Using existing Firebase app instance.");
}

// Initialize Firebase services
try {
  console.log("[Firebase Lib] Attempting to get Auth instance...");
  auth = getAuth(app);
  console.log("[Firebase Lib] Auth instance obtained successfully.");
} catch (authError) {
  console.error("[Firebase Lib] ERROR during getAuth(app):", authError);
  console.error("[Firebase Lib] This usually means the API KEY is invalid or restricted, or essential config like projectId/authDomain is missing or incorrect in your .env file.");
  console.error("[Firebase Lib] Please double-check your .env file and ensure your Next.js server was RESTARTED after changes.");
  throw authError; // Re-throw to ensure it's surfaced
}

try {
  console.log("[Firebase Lib] Attempting to get Firestore instance...");
  db = getFirestore(app);
  console.log("[Firebase Lib] Firestore instance obtained successfully.");
} catch (dbError) {
  console.error("[Firebase Lib] ERROR during getFirestore(app):", dbError);
  throw dbError;
}

try {
  console.log("[Firebase Lib] Attempting to get Storage instance...");
  storageInstance = getStorage(app); // Use the renamed variable
  console.log("[Firebase Lib] Storage instance obtained successfully.");
} catch (storageError) {
  console.error("[Firebase Lib] ERROR during getStorage(app):", storageError);
  throw storageError;
}

export { app, auth, db, storageInstance as storage }; // Export the renamed storageInstance as storage
