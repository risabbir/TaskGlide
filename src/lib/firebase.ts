
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
  console.error(errorMessage); 
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storageInstance: FirebaseStorage; // Renamed to avoid conflict

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
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
    throw initError;
  }
} else {
  app = getApps()[0]!;
}

try {
  auth = getAuth(app);
} catch (authError) {
  console.error("[Firebase Lib] ERROR during getAuth(app):", authError);
  console.error("[Firebase Lib] This usually means the API KEY is invalid or restricted, or essential config like projectId/authDomain is missing or incorrect in your .env file.");
  console.error("[Firebase Lib] Please double-check your .env file and ensure your Next.js server was RESTARTED after changes.");
  throw authError; 
}

try {
  db = getFirestore(app);
} catch (dbError) {
  console.error("[Firebase Lib] ERROR during getFirestore(app):", dbError);
  throw dbError;
}

try {
  storageInstance = getStorage(app); 
} catch (storageError) {
  console.error("[Firebase Lib] ERROR during getStorage(app):", storageError);
  throw storageError;
}

export { app, auth, db, storageInstance as storage };
