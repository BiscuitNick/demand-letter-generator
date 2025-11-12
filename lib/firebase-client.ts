import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase client configuration loaded from environment variables.
 * These values are safe to expose to the client (prefixed with NEXT_PUBLIC_).
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase client app (singleton pattern).
 * Checks if an app already exists before initializing to prevent duplicate initialization.
 */
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

/**
 * Firebase Authentication instance.
 * Use this for client-side authentication flows (sign in, sign out, etc.).
 */
export const auth: Auth = getAuth(app);

/**
 * Firestore database instance.
 * Use this for real-time database operations from the client.
 */
export const db: Firestore = getFirestore(app);

/**
 * Firebase Storage instance.
 * Use this for file uploads and downloads from the client.
 */
export const storage: FirebaseStorage = getStorage(app);

/**
 * Export the Firebase app instance for advanced use cases.
 */
export { app };
