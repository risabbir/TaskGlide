
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

// Enhanced diagnostic check
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  const errorMessage =
    'CRITICAL: Essential Firebase configuration (apiKey, authDomain, or projectId) is missing. ' +
    'Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ' +
    'and NEXT_PUBLIC_FIREBASE_PROJECT_ID are correctly set in your .env file ' +
    'and that your Next.js server has been restarted after any changes.';
  console.error(errorMessage); // Logs to server console
  if (typeof window !== 'undefined') {
    console.error(errorMessage); // Attempts to log to browser console if on client
  }
} else {
  // Log the non-sensitive parts of the config being used
  console.log("Firebase Config Loaded (Partial for Security):");
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Storage Bucket:", firebaseConfig.storageBucket);
  console.log("Messaging Sender ID:", firebaseConfig.messagingSenderId);
  console.log("App ID:", firebaseConfig.appId);
  console.log("Measurement ID:", firebaseConfig.measurementId);
  console.log("API Key: PRESENT (value not logged for security)");
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, auth, db, storage };
