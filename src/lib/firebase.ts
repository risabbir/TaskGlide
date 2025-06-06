
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingVars: string[] = [];
if (!firebaseConfig.apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
// Add checks for other critical variables if necessary

if (missingVars.length > 0) {
  const errorMessage =
    `[Firebase Lib] CRITICAL WARNING: Essential Firebase configuration variables are missing or incomplete in your .env file: ${missingVars.join(', ')}. ` +
    'This will likely lead to Firebase initialization failures or PERMISSION_DENIED errors. ' +
    'Please ensure these variables are correctly set in your .env file (at the project root) ' +
    'and that your Next.js development server has been RESTARTED after any changes.';
  console.error(errorMessage);
  // For a production build, you might want to throw an error here to halt the process if critical config is missing.
  // For development, a strong console error might be sufficient.
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storageInstance: FirebaseStorage;

try {
  if (getApps().length === 0) {
    console.log("[Firebase Lib] Initializing Firebase app with Project ID:", firebaseConfig.projectId);
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]!;
    console.log("[Firebase Lib] Using existing Firebase app instance for Project ID:", firebaseConfig.projectId);
  }
} catch (initError: any) {
  console.error("[Firebase Lib] CRITICAL ERROR during Firebase initializeApp:", initError.message, initError.code, initError);
  console.error("[Firebase Lib] The config used was (excluding API_KEY for security):", {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    measurementId: firebaseConfig.measurementId,
  });
  console.error("[Firebase Lib] This usually means your .env file variables (NEXT_PUBLIC_FIREBASE_PROJECT_ID, etc.) are incorrect, pointing to a non-existent project, or the project setup in Firebase console is incomplete.");
  throw new Error(`Firebase initialization failed: ${initError.message}. Check .env variables and Firebase project setup.`);
}

try {
  auth = getAuth(app);
} catch (authError: any) {
  console.error("[Firebase Lib] ERROR during getAuth(app):", authError.message, authError.code, authError);
  console.error("[Firebase Lib] This often means the API KEY is invalid, restricted, or essential config (like projectId/authDomain from .env) is missing/incorrect, or that the Authentication service is not properly enabled in your Firebase project.");
  throw new Error(`Firebase Auth initialization failed: ${authError.message}. Check API key, .env variables, and Firebase Authentication setup.`);
}

try {
  db = getFirestore(app);
} catch (dbError: any) {
  console.error("[Firebase Lib] ERROR during getFirestore(app):", dbError.message, dbError.code, dbError);
  console.error("[Firebase Lib] Ensure Firestore (Native mode) is enabled and set up correctly in your Firebase project for the region you intend to use.");
  throw new Error(`Firestore initialization failed: ${dbError.message}. Check Firestore setup in Firebase Console.`);
}

try {
  storageInstance = getStorage(app);
} catch (storageError: any) {
  console.error("[Firebase Lib] ERROR during getStorage(app):", storageError.message, storageError.code, storageError);
  console.error("[Firebase Lib] Ensure Firebase Storage is enabled and set up correctly in your Firebase project.");
  throw new Error(`Firebase Storage initialization failed: ${storageError.message}. Check Storage setup in Firebase Console.`);
}

export { app, auth, db, storageInstance as storage };
