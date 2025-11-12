'use client'

import { useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import type { Firestore } from 'firebase/firestore'
import { useYDoc } from './useYDoc'
import { useFirestoreProvider } from './useFirestoreProvider'
import { getCollaborativeExtensions, editorConfig } from '../config'
import type { EditorUser, SaveStatus } from '../types'

export interface UseCollaborativeEditorOptions {
  docId: string
  db: Firestore
  user: EditorUser
  onSave?: (content: string) => void
  onError?: (error: Error) => void
}

export interface UseCollaborativeEditorReturn {
  editor: Editor | null
  synced: boolean
  error: Error | null
  saveStatus: SaveStatus
}

/**
 * Main hook for collaborative editing with Tiptap + Y.js + Firestore.
 * Manages the editor lifecycle, CRDT synchronization, and presence indicators.
 *
 * @param options - Configuration options
 * @returns Editor instance, sync status, errors, and save status
 *
 * @example
 * ```tsx
 * const { editor, synced, error, saveStatus } = useCollaborativeEditor({
 *   docId: 'document-123',
 *   db: firestore,
 *   user: { id: 'user-1', name: 'John Doe', color: '#FF0000' },
 *   onSave: (content) => console.log('Saved:', content),
 *   onError: (error) => console.error('Error:', error)
 * })
 * ```
 */
export function useCollaborativeEditor({
  docId,
  db,
  user,
  onSave,
  onError,
}: UseCollaborativeEditorOptions): UseCollaborativeEditorReturn {
  // Initialize Y.Doc
  const ydoc = useYDoc(docId)

  // Set up Firestore provider and awareness
  const { provider, awareness, synced, error } = useFirestoreProvider({
    ydoc,
    docId,
    db,
    user,
  })

  // Initialize Tiptap editor with collaborative extensions
  const editor = useEditor({
    extensions: getCollaborativeExtensions(ydoc, user),
    editorProps: editorConfig.editorProps,
    onCreate: ({ editor }) => {
      console.log('[useCollaborativeEditor] Editor created')
    },
    onUpdate: ({ editor }) => {
      // Optional: Call onSave with debouncing
      // This will be handled by the autosave hook separately
      console.log('[useCollaborativeEditor] Content updated')
    },
  }, [docId])

  // Handle provider errors
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  // Determine save status based on sync state
  const saveStatus: SaveStatus = {
    status: synced ? 'saved' : error ? 'error' : 'saving',
    message: error?.message,
    lastSaved: synced ? new Date() : undefined,
  }

  return {
    editor,
    synced,
    error,
    saveStatus,
  }
}
