# Inline Comments & Sidebar Discussions

A collaborative commenting system for the rich-text editor, similar to Google Docs comments.

## Features

- **Anchored Comments**: Comments tied to specific text selections
- **Visual Highlights**: Inline badges and text highlighting for commented sections
- **Threaded Discussions**: Reply to comments with full conversation threads
- **Resolve/Unresolve**: Mark comments as resolved while keeping them visible
- **Real-time Sync**: All comments update in real-time across collaborators
- **Unresolved Counter**: Track open discussions at a glance
- **Permission-based**: Only document collaborators can comment

## Usage

### Basic Example

```tsx
import { EditorWithComments } from '@/components/editor/EditorWithComments'
import { db } from '@/lib/firebase-client'

export default function DocumentPage() {
  const user = {
    id: 'user-123',
    name: 'John Doe',
    color: '#4F46E5'
  }

  return (
    <EditorWithComments
      docId="document-id"
      db={db}
      user={user}
      onSave={(content) => console.log('Saved:', content)}
      onError={(error) => console.error('Error:', error)}
    />
  )
}
```

### Using the Comment Hook Separately

```tsx
import { useComments } from '@/lib/comments'

function MyComponent({ docId, userId }) {
  const {
    comments,
    unresolvedCount,
    createComment,
    addReply,
    resolveComment,
    deleteComment
  } = useComments({ db, docId, userId })

  const handleAddComment = async () => {
    await createComment({
      range: { from: 0, to: 10, text: 'selected text' },
      text: 'This is my comment',
      author: { id: userId, name: 'John', color: '#FF0000' }
    })
  }

  return (
    <div>
      <p>Unresolved: {unresolvedCount}</p>
      {/* Your UI */}
    </div>
  )
}
```

## Architecture

### Components

- **EditorWithComments**: Full editor with integrated comment system
- **CommentSidebar**: Right-rail sidebar for viewing/managing comments
- **CommentThread**: Individual comment with replies
- **NewCommentPopover**: Popover for creating new comments

### Hooks

- **useComments**: Main hook for managing comments
  - Real-time Firestore subscription
  - CRUD operations
  - Unresolved count tracking

### Services

- **createComment**: Add a new comment anchored to text
- **addReply**: Reply to an existing comment
- **toggleResolveComment**: Resolve or unresolve a comment
- **deleteComment**: Remove a comment (author only)
- **subscribeToComments**: Real-time listener for comment updates

## Firestore Structure

```
comments/
  {commentId}/
    docId: string
    range: {
      from: number
      to: number
      text?: string
    }
    text: string
    authorId: string
    authorName: string
    authorColor: string
    createdAt: timestamp
    updatedAt?: timestamp
    resolved: boolean
    replies: [
      {
        id: string
        text: string
        authorId: string
        authorName: string
        authorColor: string
        createdAt: timestamp
      }
    ]
```

## Comment States

### Highlight Colors

- **Active Comment** (blue): Currently selected/focused comment
- **Unresolved** (yellow): Comment awaiting resolution
- **Resolved** (gray): Resolved comments, shown with reduced opacity

### Visual Indicators

Comments show inline badges (💬) at the end of highlighted text:
- Yellow: Unresolved
- Blue: Active/selected
- Gray: Resolved

## User Interactions

### Creating Comments

1. Select text in the editor
2. Click "Comment" button in toolbar
3. Type your comment in the popover
4. Click "Comment" to submit

### Replying to Comments

1. Click on a comment in the sidebar or inline badge
2. Click "Reply" button
3. Type your reply
4. Click "Reply" to submit

### Resolving Comments

1. Click the "..." menu on a comment
2. Select "Resolve" or "Unresolve"
3. Comment appearance updates to resolved state

### Deleting Comments

1. Click the "..." menu on your own comment
2. Select "Delete"
3. Confirm deletion (comment removed immediately)

## CSS Styling

The system uses custom CSS classes for comment highlights:

```css
.comment-highlight     /* Yellow highlight for unresolved */
.comment-active        /* Blue highlight for active */
.comment-resolved      /* Gray highlight for resolved */
.comment-badge         /* Inline emoji badges */
```

These are defined in `app/editor-comments.css`.

## Real-time Features

### Firestore Subscriptions

Comments automatically sync across all connected clients:
- New comments appear immediately
- Replies show in real-time
- Resolve status updates instantly
- Deleted comments disappear for all users

### Optimistic Updates

The UI updates optimistically while waiting for Firestore:
- Immediate visual feedback
- Rollback on error
- Loading states for async operations

## Permissions

### Comment Creation

Only authenticated users can create comments. Check your Firestore security rules:

```javascript
match /comments/{commentId} {
  // Anyone can read comments on documents they can access
  allow read: if request.auth != null;

  // Only authenticated users can create comments
  allow create: if request.auth != null
    && request.resource.data.authorId == request.auth.uid;

  // Only author can update/delete their comments
  allow update, delete: if request.auth != null
    && resource.data.authorId == request.auth.uid;
}
```

## Performance

### Indexing

Create Firestore composite indexes for optimal query performance:

```
Collection: comments
Fields:
  - docId (Ascending)
  - createdAt (Ascending)
```

### Comment Count

For documents with many comments (100+), consider:
- Pagination in the sidebar
- Filtering by resolved status
- Lazy loading of replies

## Accessibility

### Keyboard Navigation

- Tab through comments in sidebar
- Enter to activate/focus comment
- Escape to close popover

### Screen Readers

- Semantic HTML structure
- ARIA labels on interactive elements
- Clear focus indicators

## Troubleshooting

### Comments Not Appearing

1. Check Firestore security rules
2. Verify user authentication
3. Check browser console for errors
4. Ensure docId matches document

### Highlights Not Showing

1. Verify comment range is valid (from < to)
2. Check that CSS is imported in globals.css
3. Ensure editor has loaded successfully
4. Clear browser cache

### Real-time Sync Issues

1. Check network connectivity
2. Verify Firestore quota limits
3. Check for console errors
4. Test with Firestore emulator

## Future Enhancements

Potential improvements for production:

- **Comment Notifications**: Email/push notifications for mentions
- **Mentions/Tagging**: @mention other collaborators
- **Comment Search**: Find comments by content or author
- **Comment History**: Track edits to comments
- **Bulk Operations**: Resolve multiple comments at once
- **Comment Export**: Include comments in document exports
- **Rich Text in Comments**: Formatting in comment text
- **Comment Analytics**: Track comment activity and engagement
