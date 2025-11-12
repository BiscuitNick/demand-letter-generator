'use client'

import { useState, useCallback } from 'react'
import { EditorContent } from '@tiptap/react'
import type { Firestore } from 'firebase/firestore'
import { useCollaborativeEditor } from '@/lib/editor/hooks/useCollaborativeEditor'
import { useAutosave } from '@/lib/editor/hooks/useAutosave'
import { useCollaboratorPresence } from '@/lib/editor/hooks/useCollaboratorPresence'
import { useComments } from '@/lib/comments/hooks/useComments'
import { EditorToolbar } from './EditorToolbar'
import { CollaboratorAvatars } from './CollaboratorAvatars'
import { SaveStatusBadge } from './SaveStatusBadge'
import { TonePresetSelector } from './TonePresetSelector'
import { ExportMenu } from './ExportMenu'
import { CommentSidebar } from '../comments/CommentSidebar'
import { NewCommentPopover } from '../comments/NewCommentPopover'
import type { EditorUser } from '@/lib/editor/types'
import type { CommentRange } from '@/lib/comments/types'
import type { TonePreset } from '@/lib/templates/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface EditorWithCommentsProps {
  docId: string
  db: Firestore
  user: EditorUser
  onSave?: (content: string) => void
  onError?: (error: Error) => void
  checkPermissions?: () => Promise<boolean>
  showCommentsSidebar?: boolean
}

/**
 * Collaborative editor with integrated comment system.
 * Combines real-time editing with anchored comments and discussions.
 */
export function EditorWithComments({
  docId,
  db,
  user,
  onSave,
  onError,
  checkPermissions,
  showCommentsSidebar = true,
}: EditorWithCommentsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(showCommentsSidebar)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [showNewCommentPopover, setShowNewCommentPopover] = useState(false)
  const [selectedRange, setSelectedRange] = useState<CommentRange | null>(null)
  const { toast } = useToast()

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
    ydoc: editor?.state.doc as any,
    docId,
    db,
    enabled: synced && !!editor,
    onSave: onSave
      ? () => {
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

  // Manage comments
  const {
    comments,
    unresolvedCount,
    loading: commentsLoading,
    error: commentsError,
    createComment,
    addReply,
    resolveComment,
    unresolveComment,
    deleteComment,
  } = useComments({
    db,
    docId,
    userId: user.id,
  })

  // Handle adding a new comment
  const handleAddComment = useCallback(() => {
    if (!editor) return

    const { from, to } = editor.state.selection
    if (from === to) return // No selection

    const selectedText = editor.state.doc.textBetween(from, to)

    setSelectedRange({
      from,
      to,
      text: selectedText,
    })
    setShowNewCommentPopover(true)
  }, [editor])

  // Handle creating a comment
  const handleCreateComment = useCallback(
    async (text: string) => {
      if (!selectedRange) return

      try {
        const commentId = await createComment({
          range: selectedRange,
          text,
          author: {
            id: user.id,
            name: user.name,
            color: user.color,
          },
        })

        setActiveCommentId(commentId)
        setShowNewCommentPopover(false)
        setSelectedRange(null)
        setSidebarOpen(true)
      } catch (error) {
        console.error('Failed to create comment:', error)
      }
    },
    [selectedRange, createComment, user]
  )

  // Handle replying to a comment
  const handleReply = useCallback(
    async (commentId: string, text: string) => {
      try {
        await addReply({
          commentId,
          text,
          author: {
            id: user.id,
            name: user.name,
            color: user.color,
          },
        })
      } catch (error) {
        console.error('Failed to add reply:', error)
      }
    },
    [addReply, user]
  )

  // Handle tone refinement
  const handleRefine = useCallback(
    async (tonePreset: TonePreset, instructions?: string) => {
      try {
        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docId,
            tonePreset,
            instructions,
          }),
        })

        if (!response.ok) {
          throw new Error('Refinement failed')
        }

        toast({
          title: 'Document refined',
          description: 'Your document has been refined with the selected tone.',
        })

        // Optionally reload the editor content
        // The editor will sync automatically via Firestore
      } catch (error) {
        console.error('Refinement error:', error)
        toast({
          title: 'Refinement failed',
          description: 'Failed to refine document. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [docId, toast]
  )

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
    <div className="flex h-full border rounded-lg overflow-hidden bg-background">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with collaborators and save status */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <CollaboratorAvatars collaborators={collaborators} />
          <div className="flex items-center gap-2">
            <SaveStatusBadge status={autosaveStatus} />
            {unresolvedCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {unresolvedCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {sidebarOpen ? 'Hide' : 'Show'} Comments
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b">
          <EditorToolbar editor={editor} />
          <div className="flex items-center gap-2 mr-2">
            <ExportMenu docId={docId} disabled={!synced} />
            <TonePresetSelector onRefine={handleRefine} disabled={!synced} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddComment}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto">
          <div className="comment-editor">
            <EditorContent
              editor={editor}
              className="prose prose-sm sm:prose lg:prose-lg max-w-none p-8"
            />
          </div>
        </div>
      </div>

      {/* Comment sidebar */}
      {sidebarOpen && (
        <CommentSidebar
          comments={comments}
          currentUser={user}
          activeCommentId={activeCommentId}
          unresolvedCount={unresolvedCount}
          onResolveComment={resolveComment}
          onUnresolveComment={unresolveComment}
          onDeleteComment={deleteComment}
          onReply={handleReply}
          onCommentClick={setActiveCommentId}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* New comment popover */}
      <NewCommentPopover
        open={showNewCommentPopover}
        selectedText={selectedRange?.text}
        onSubmit={handleCreateComment}
        onCancel={() => {
          setShowNewCommentPopover(false)
          setSelectedRange(null)
        }}
      />
    </div>
  )
}
