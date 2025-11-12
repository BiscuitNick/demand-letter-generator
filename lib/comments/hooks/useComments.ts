'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Firestore } from 'firebase/firestore'
import type { Comment, CreateCommentOptions, AddReplyOptions } from '../types'
import {
  createComment as createCommentService,
  addReply as addReplyService,
  toggleResolveComment,
  deleteComment as deleteCommentService,
  subscribeToComments,
  getUnresolvedCount,
} from '../service'

export interface UseCommentsOptions {
  db: Firestore
  docId: string
  userId: string
}

export interface UseCommentsReturn {
  comments: Comment[]
  unresolvedCount: number
  loading: boolean
  error: Error | null
  createComment: (options: Omit<CreateCommentOptions, 'docId'>) => Promise<string>
  addReply: (options: AddReplyOptions) => Promise<void>
  resolveComment: (commentId: string) => Promise<void>
  unresolveComment: (commentId: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
}

/**
 * Hook for managing comments on a document.
 * Provides real-time updates and CRUD operations.
 *
 * @param options - Configuration options
 * @returns Comment data and operations
 */
export function useComments({
  db,
  docId,
  userId,
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Subscribe to comments
  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToComments(
      db,
      docId,
      (updatedComments) => {
        setComments(updatedComments)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [db, docId])

  // Create a new comment
  const createComment = useCallback(
    async (options: Omit<CreateCommentOptions, 'docId'>): Promise<string> => {
      try {
        const commentId = await createCommentService(db, {
          ...options,
          docId,
        })
        return commentId
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db, docId]
  )

  // Add a reply to a comment
  const addReply = useCallback(
    async (options: AddReplyOptions): Promise<void> => {
      try {
        await addReplyService(db, options)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db]
  )

  // Resolve a comment
  const resolveComment = useCallback(
    async (commentId: string): Promise<void> => {
      try {
        await toggleResolveComment(db, commentId, true)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db]
  )

  // Unresolve a comment
  const unresolveComment = useCallback(
    async (commentId: string): Promise<void> => {
      try {
        await toggleResolveComment(db, commentId, false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db]
  )

  // Delete a comment
  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      try {
        await deleteCommentService(db, commentId)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db]
  )

  return {
    comments,
    unresolvedCount: getUnresolvedCount(comments),
    loading,
    error,
    createComment,
    addReply,
    resolveComment,
    unresolveComment,
    deleteComment,
  }
}
