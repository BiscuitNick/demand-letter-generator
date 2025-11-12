'use client'

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CommentThread } from './CommentThread'
import { X, MessageSquarePlus } from 'lucide-react'
import type { Comment, CommentRange } from '@/lib/comments/types'

interface CommentSidebarProps {
  comments: Comment[]
  currentUser: {
    id: string
    name: string
    color: string
  }
  activeCommentId?: string | null
  unresolvedCount: number
  showResolved?: boolean
  onCreateComment?: (range: CommentRange, text: string) => Promise<void>
  onResolveComment: (commentId: string) => Promise<void>
  onUnresolveComment: (commentId: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onReply: (commentId: string, text: string) => Promise<void>
  onCommentClick: (commentId: string) => void
  onClose?: () => void
}

/**
 * Sidebar component for displaying and managing comments
 */
export function CommentSidebar({
  comments,
  currentUser,
  activeCommentId,
  unresolvedCount,
  showResolved = false,
  onCreateComment,
  onResolveComment,
  onUnresolveComment,
  onDeleteComment,
  onReply,
  onCommentClick,
  onClose,
}: CommentSidebarProps) {
  const [showResolvedComments, setShowResolvedComments] = useState(showResolved)

  // Filter comments based on resolved status
  const filteredComments = showResolvedComments
    ? comments
    : comments.filter((c) => !c.resolved)

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Comments</h3>
            {unresolvedCount > 0 && (
              <Badge variant="secondary">{unresolvedCount} unresolved</Badge>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Show resolved toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => setShowResolvedComments(!showResolvedComments)}
        >
          {showResolvedComments ? 'Hide' : 'Show'} resolved comments
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">
                Select text in the editor to add a comment
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                currentUserId={currentUser.id}
                isActive={comment.id === activeCommentId}
                onResolve={() => onResolveComment(comment.id)}
                onUnresolve={() => onUnresolveComment(comment.id)}
                onDelete={() => onDeleteComment(comment.id)}
                onReply={(text) => onReply(comment.id, text)}
                onClick={() => onCommentClick(comment.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
