# Collaborative Rich-Text Editor

A Google Docs-style collaborative editor built with Tiptap, Y.js, and Firestore.

## Features

- **Real-time Collaboration**: Multiple users can edit simultaneously using Y.js CRDT
- **Presence Indicators**: See who's currently editing with avatar badges
- **Rich Text Formatting**: Bold, italic, headings, lists, and more
- **Autosave**: Automatic saving every 5 seconds with debouncing
- **Firestore Sync**: All changes synced to Firestore in real-time
- **Permission Checking**: Optional permission guards before saving
- **Error Handling**: Graceful error handling with retry logic

## Usage

### Basic Example

```tsx
import { CollaborativeEditor } from '@/components/editor'
import { db } from '@/lib/firebase-client'

export default function DocumentPage() {
  const user = {
    id: 'user-123',
    name: 'John Doe',
    color: '#4F46E5'
  }

  return (
    <CollaborativeEditor
      docId="document-id"
      db={db}
      user={user}
      onSave={(content) => console.log('Saved:', content)}
      onError={(error) => console.error('Error:', error)}
      checkPermissions={async () => {
        // Implement your permission logic
        return true
      }}
    />
  )
}
```

### Using Individual Hooks

You can also use the underlying hooks separately for more control:

```tsx
import { useYDoc, useFirestoreProvider, useCollaborativeEditor, useAutosave } from '@/lib/editor'

function CustomEditor({ docId, db, user }) {
  // Initialize Y.Doc
  const ydoc = useYDoc(docId)

  // Set up Firestore sync
  const { synced, error } = useFirestoreProvider({
    ydoc,
    docId,
    db,
    user
  })

  // Initialize editor
  const { editor } = useCollaborativeEditor({
    docId,
    db,
    user
  })

  // Set up autosave
  const { saveStatus } = useAutosave({
    ydoc,
    docId,
    db,
    enabled: synced
  })

  return <EditorContent editor={editor} />
}
```

## Architecture

### Components

- **CollaborativeEditor**: Main editor component that combines all features
- **EditorToolbar**: Formatting toolbar with bold, italic, lists, etc.
- **CollaboratorAvatars**: Display active collaborators
- **SaveStatusBadge**: Shows save status (Saving/Saved/Error)

### Hooks

- **useYDoc**: Manages Y.Doc lifecycle per document
- **useFirestoreProvider**: Syncs Y.Doc with Firestore
- **useCollaborativeEditor**: Main editor hook combining Tiptap + Y.js
- **useAutosave**: Debounced autosave with retry logic
- **useCollaboratorPresence**: Tracks active collaborators

### Providers

- **FirestoreProvider**: Custom provider for Y.js ↔ Firestore synchronization

## Firestore Structure

```
documents/
  {docId}/
    content: string (base64-encoded Y.Doc state)
    updatedAt: timestamp
    collaborators/
      {userId}/
        id: string
        name: string
        color: string
        lastSeen: timestamp
        cursor: number
```

## Configuration

### Editor Extensions

The editor uses the following Tiptap extensions:

- StarterKit (with history disabled - Y.js handles undo/redo)
- Placeholder
- Collaboration (Y.js integration)
- CollaborationCursor (presence indicators)

### Autosave Settings

- **Debounce**: 2 seconds (configurable)
- **Max Interval**: 5 seconds (ensures saves at least every 5s)
- **Triggers**: Content changes, blur events, unmount

## Security

### Firestore Rules

Make sure to set up appropriate Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{docId} {
      // Only authenticated users can read
      allow read: if request.auth != null;

      // Only collaborators can write
      allow write: if request.auth != null
        && request.auth.uid in resource.data.collaborators;

      match /collaborators/{userId} {
        // Users can manage their own presence
        allow read: if request.auth != null;
        allow write: if request.auth != null
          && request.auth.uid == userId;
      }
    }
  }
}
```

### Permission Checking

Pass a `checkPermissions` function to verify write access:

```tsx
<CollaborativeEditor
  checkPermissions={async () => {
    const hasAccess = await verifyUserHasWriteAccess(docId, userId)
    return hasAccess
  }}
/>
```

## Testing

The implementation includes:

- Unit tests for Y.Doc lifecycle
- Provider sync tests
- Autosave interval tests (Jest fake timers)
- Component tests for toolbar and presence indicators

Run tests with:

```bash
npm test
```

## Performance

- **CRDT Synchronization**: Efficient Y.js CRDT ensures fast sync
- **Debounced Updates**: Reduces Firestore write operations
- **Optimistic UI**: Immediate visual feedback while syncing
- **Cleanup**: Proper resource cleanup on unmount

## Troubleshooting

### Connection Issues

If the editor shows "Connection error":

1. Check Firestore security rules
2. Verify Firebase authentication
3. Check browser console for detailed errors
4. Ensure network connectivity

### Sync Delays

If changes aren't syncing:

1. Check the save status badge
2. Verify autosave is enabled
3. Check for permission errors
4. Monitor Firestore quota limits

## Future Enhancements

Potential improvements for production:

- Operational transformation for conflict resolution
- More robust reconnection logic with exponential backoff
- Offline support with local persistence
- Version history tracking
- More formatting options (images, tables, etc.)
- Mobile responsiveness improvements
