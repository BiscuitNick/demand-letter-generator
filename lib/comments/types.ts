import type { Timestamp } from 'firebase/firestore'

/**
 * Text range in the document for comment anchoring
 */
export interface CommentRange {
  from: number
  to: number
  text?: string // Optional text content for display
}

/**
 * Comment document stored in Firestore
 */
export interface Comment {
  id: string
  docId: string
  range: CommentRange
  text: string
  authorId: string
  authorName: string
  authorColor: string
  createdAt: Date
  updatedAt?: Date
  resolved: boolean
  replies?: CommentReply[]
}

/**
 * Reply to a comment
 */
export interface CommentReply {
  id: string
  text: string
  authorId: string
  authorName: string
  authorColor: string
  createdAt: Date
}

/**
 * Firestore comment document (with Timestamp types)
 */
export interface CommentDocument {
  docId: string
  range: CommentRange
  text: string
  authorId: string
  authorName: string
  authorColor: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  resolved: boolean
  replies?: Array<{
    id: string
    text: string
    authorId: string
    authorName: string
    authorColor: string
    createdAt: Timestamp
  }>
}

/**
 * Comment with UI state
 */
export interface CommentWithState extends Comment {
  isHighlighted?: boolean
  isActive?: boolean
  unresolvedReplyCount?: number
}

/**
 * Options for creating a new comment
 */
export interface CreateCommentOptions {
  docId: string
  range: CommentRange
  text: string
  author: {
    id: string
    name: string
    color: string
  }
}

/**
 * Options for adding a reply to a comment
 */
export interface AddReplyOptions {
  commentId: string
  text: string
  author: {
    id: string
    name: string
    color: string
  }
}
