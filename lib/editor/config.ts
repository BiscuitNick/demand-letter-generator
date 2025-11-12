import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import type { Extensions } from '@tiptap/react'

/**
 * Base Tiptap editor extensions for CRDT collaboration.
 * Includes StarterKit (basic formatting), Placeholder, Collaboration (Y.js sync),
 * and CollaborationCursor (presence indicators).
 */
export const getBaseExtensions = (): Extensions => [
  StarterKit.configure({
    // Disable history extension as Y.js provides its own undo/redo
    history: false,
  }),
  Placeholder.configure({
    placeholder: 'Start writing your demand letter...',
  }),
]

/**
 * Returns extensions configured for collaborative editing with Y.js
 * @param ydoc - The Yjs document instance
 * @param user - Current user info for presence indicators
 */
export const getCollaborativeExtensions = (
  ydoc: any,
  user: { id: string; name: string; color: string }
): Extensions => [
  ...getBaseExtensions(),
  Collaboration.configure({
    document: ydoc,
  }),
  CollaborationCursor.configure({
    provider: null, // We'll handle provider separately via custom hook
    user: {
      name: user.name,
      color: user.color,
    },
  }),
]

/**
 * Editor configuration options
 */
export const editorConfig = {
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] max-w-none p-4',
    },
  },
}
