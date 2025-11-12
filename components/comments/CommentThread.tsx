'use client'

import { useState } from 'react'
import { Check, MoreVertical, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { Comment } from '@/lib/comments/types'

interface CommentThreadProps {
  comment: Comment
  currentUserId: string
  isActive?: boolean
  onResolve: () => Promise<void>
  onUnresolve: () => Promise<void>
  onDelete: () => Promise<void>
  onReply: (text: string) => Promise<void>
  onClick: () => void
}

/**
 * Display a single comment thread with replies
 */
export function CommentThread({
  comment,
  currentUserId,
  isActive = false,
  onResolve,
  onUnresolve,
  onDelete,
  onReply,
  onClick,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim()) return

    setIsSubmitting(true)
    try {
      await onReply(replyText)
      setReplyText('')
      setIsReplying(false)
    } catch (error) {
      console.error('Failed to add reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolve = async () => {
    try {
      if (comment.resolved) {
        await onUnresolve()
      } else {
        await onResolve()
      }
    } catch (error) {
      console.error('Failed to toggle resolve:', error)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isActive
          ? 'bg-blue-50 border-blue-300'
          : comment.resolved
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback
            style={{
              backgroundColor: comment.authorColor,
              color: '#ffffff',
            }}
            className="text-xs"
          >
            {getInitials(comment.authorName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {comment.authorName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(comment.createdAt)}
            </span>
            {comment.resolved && (
              <Badge variant="secondary" className="text-xs">
                Resolved
              </Badge>
            )}
          </div>

          {/* Quoted text */}
          {comment.range.text && (
            <div className="text-xs text-muted-foreground italic mt-1 p-1 bg-gray-100 rounded border-l-2 border-gray-300">
              "{comment.range.text}"
            </div>
          )}
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleResolve}>
              <Check className="h-4 w-4 mr-2" />
              {comment.resolved ? 'Unresolve' : 'Resolve'}
            </DropdownMenuItem>
            {comment.authorId === currentUserId && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comment text */}
      <p className="text-sm whitespace-pre-wrap mb-2">{comment.text}</p>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback
                  style={{
                    backgroundColor: reply.authorColor,
                    color: '#ffffff',
                  }}
                  className="text-xs"
                >
                  {getInitials(reply.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{reply.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reply.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {isReplying ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="text-sm min-h-[60px]"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={!replyText.trim() || isSubmitting}
            >
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsReplying(false)
                setReplyText('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setIsReplying(true)
          }}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Reply
        </Button>
      )}
    </div>
  )
}
