import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Guard to ensure this module is only imported on the server.
 * Firebase Admin SDK should never run in the browser.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "Firebase Admin SDK cannot be used in the browser. " +
    "This module should only be imported in server-side code (API routes, Server Actions, etc.)."
  );
}

/**
 * Initialize Firebase Admin SDK with service account credentials.
 * Supports two methods:
 * 1. GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to JSON file
 * 2. Individual environment variables for project ID, client email, and private key
 *
 * This uses lazy initialization - the app is only created when first accessed.
 */
function initializeFirebaseAdmin(): App {
  // Check if already initialized
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Method 1: Use GOOGLE_APPLICATION_CREDENTIALS if available
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    });
  }

  // Method 2: Use individual environment variables
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are not configured. " +
      "Set GOOGLE_APPLICATION_CREDENTIALS or provide " +
      "FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Handle escaped newlines in private key
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
    projectId,
  });
}

/**
 * Lazily initialized Firebase Admin app instance.
 */
let adminApp: App | undefined;

/**
 * Get the Firebase Admin app instance (lazy initialization).
 */
function getAdminApp(): App {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  return adminApp;
}

/**
 * Firebase Admin Auth instance.
 * Use this for server-side authentication operations (verify tokens, manage users, etc.).
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Firebase Admin Firestore instance.
 * Use this for server-side database operations with elevated privileges.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Firebase Admin Storage instance.
 * Use this for server-side storage operations with admin access.
 */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

/**
 * Export the admin app getter for advanced use cases.
 */
export { getAdminApp };
