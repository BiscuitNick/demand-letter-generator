'use client'

import { EditorContent } from '@tiptap/react'
import type { Firestore } from 'firebase/firestore'
import { useCollaborativeEditor } from '@/lib/editor/hooks/useCollaborativeEditor'
import { useAutosave } from '@/lib/editor/hooks/useAutosave'
import { useCollaboratorPresence } from '@/lib/editor/hooks/useCollaboratorPresence'
import { EditorToolbar } from './EditorToolbar'
import { CollaboratorAvatars } from './CollaboratorAvatars'
import { SaveStatusBadge } from './SaveStatusBadge'
import type { EditorUser } from '@/lib/editor/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface CollaborativeEditorProps {
  docId: string
  db: Firestore
  user: EditorUser
  onSave?: (content: string) => void
  onError?: (error: Error) => void
  checkPermissions?: () => Promise<boolean>
}

/**
 * Main collaborative editor component.
 * Combines Tiptap editor, Y.js CRDT sync, presence indicators,
 * formatting toolbar, and autosave functionality.
 *
 * @example
 * ```tsx
 * <CollaborativeEditor
 *   docId="document-123"
 *   db={firestore}
 *   user={{ id: 'user-1', name: 'John Doe', color: '#FF0000' }}
 *   onSave={(content) => console.log('Saved:', content)}
 *   onError={(error) => console.error('Error:', error)}
 * />
 * ```
 */
export function CollaborativeEditor({
  docId,
  db,
  user,
  onSave,
  onError,
  checkPermissions,
}: CollaborativeEditorProps) {
  // Initialize collaborative editor
  const { editor, synced, error, saveStatus: editorSaveStatus } = useCollaborativeEditor({
    docId,
    db,
    user,
    onSave,
    onError,
  })

  // Set up autosave
  const { saveStatus: autosaveStatus } = useAutosave({
    ydoc: editor?.state.doc as any, // Y.Doc is embedded in Tiptap state
    docId,
    db,
    enabled: synced && !!editor,
    onSave: onSave
      ? () => {
          // Get the current content and pass it to onSave
          const content = editor?.getHTML() || ''
          onSave(content)
        }
      : undefined,
    onError,
    checkPermissions,
  })

  // Track collaborator presence
  const { collaborators } = useCollaboratorPresence({
    db,
    docId,
    user,
  })

  // Show loading state while syncing
  if (!synced || !editor) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {error ? 'Connection error...' : 'Loading editor...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error alert if connection failed
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to connect to the collaborative editor: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header with collaborators and save status */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <CollaboratorAvatars collaborators={collaborators} />
        <SaveStatusBadge status={autosaveStatus} />
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="min-h-[500px] max-h-[800px] overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose lg:prose-lg max-w-none"
        />
      </div>
    </div>
  )
}
