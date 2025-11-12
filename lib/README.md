# Firebase Integration

This directory contains Firebase client/admin SDK integrations and helper utilities.

## Files Overview

### `firebase-client.ts`
Client-side Firebase initialization with singleton pattern.

**Exports:**
- `auth` - Firebase Authentication instance
- `db` - Firestore database instance
- `storage` - Firebase Storage instance
- `app` - Firebase app instance

**Usage:**
```typescript
import { auth, db, storage } from '@/lib/firebase-client';

// Use in client components
const user = auth.currentUser;
```

### `firebase-admin.ts`
Server-side Firebase Admin SDK initialization (lazy loading).

**Exports:**
- `getAdminAuth()` - Get Admin Auth instance
- `getAdminDb()` - Get Admin Firestore instance
- `getAdminStorage()` - Get Admin Storage instance
- `getAdminApp()` - Get Admin app instance

**Usage:**
```typescript
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Use in API routes or Server Actions
const user = await getAdminAuth().getUser(uid);
```

### `auth-helpers.ts`
Authentication and session management utilities.

**Key Functions:**
- `getUserSession()` - Get current user session from cookie
- `requireAuth()` - Require authentication (throws if not authenticated)
- `withUserClaims(handler)` - HOF to wrap route handlers with auth
- `verifyAuthHeader(request)` - Verify Bearer token from Authorization header
- `hasCustomClaim(user, claim, value?)` - Check custom claims
- `requireCustomClaim(user, claim, value?)` - Require specific claim

**Usage:**
```typescript
// In API routes
export const GET = withUserClaims(async (req, { user }) => {
  // user.uid, user.email available
  return NextResponse.json({ message: `Hello ${user.email}` });
});

// In Server Actions
const user = await requireAuth();
```

### `firestore-types.ts`
TypeScript type definitions for Firestore documents.

**Types:**
- `Document` - Demand letter document
- `Comment` - Inline comment/discussion
- `Template` - Tone/style template
- `Fact`, `OutlineSection`, `SourceDocument`, `Collaborator` - Supporting types

### `firestore-converters.ts`
Firestore data converters for type-safe document operations.

**Exports:**
- `documentConverter` - Document type converter
- `commentConverter` - Comment type converter
- `templateConverter` - Template type converter

### `firestore-helpers.ts`
Convenience functions for typed Firestore operations.

**Functions:**
- `getDocumentsCollection()` - Get typed documents collection
- `getDocumentRef(docId)` - Get typed document reference
- `getCommentsCollection()` - Get typed comments collection
- `getDocumentCommentsCollection(docId)` - Get comments for a document
- `getTemplatesCollection()` - Get typed templates collection
- `getTemplateRef(templateId)` - Get typed template reference

**Usage:**
```typescript
import { getDocumentsCollection, getDocumentRef } from '@/lib/firestore-helpers';
import { getDocs, getDoc } from 'firebase/firestore';

// Query all documents
const snapshot = await getDocs(getDocumentsCollection());
const documents = snapshot.docs.map(doc => doc.data()); // Fully typed

// Get single document
const docRef = getDocumentRef('doc-123');
const doc = await getDoc(docRef);
if (doc.exists()) {
  const data = doc.data(); // Fully typed as Document
}
```

## Environment Variables

### Client (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Admin (Server-side)
Option 1 - Individual variables:
```
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Option 2 - Service account file:
```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

## Firebase Setup Steps

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication, Firestore, and Storage
3. Download service account credentials (Settings → Service Accounts)
4. Copy `.env.local.example` to `.env.local` and fill in values
5. Set up Firestore security rules
6. (Optional) Install Firebase CLI for emulators: `npm install -g firebase-tools`

## Firestore Collections

- `/documents` - Main demand letter documents
- `/documents/{docId}/comments` - Comments for a document
- `/documents/{docId}/sources` - Source files for a document
- `/comments` - Global comments collection
- `/templates` - Tone/style templates

## Security Notes

- ⚠️ Never commit `.env.local` to version control
- ⚠️ Admin credentials have elevated privileges - use only server-side
- ⚠️ Client code should use Firestore security rules for access control
- ⚠️ Always validate user sessions in API routes before sensitive operations
