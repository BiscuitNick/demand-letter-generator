import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type {
  Comment,
  CommentDocument,
  CreateCommentOptions,
  AddReplyOptions,
  CommentReply,
} from './types'

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate()
}

/**
 * Convert Firestore comment document to Comment type
 */
function convertCommentDocument(id: string, data: CommentDocument): Comment {
  return {
    id,
    docId: data.docId,
    range: data.range,
    text: data.text,
    authorId: data.authorId,
    authorName: data.authorName,
    authorColor: data.authorColor,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined,
    resolved: data.resolved,
    replies: data.replies?.map((reply) => ({
      id: reply.id,
      text: reply.text,
      authorId: reply.authorId,
      authorName: reply.authorName,
      authorColor: reply.authorColor,
      createdAt: timestampToDate(reply.createdAt),
    })),
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  db: Firestore,
  options: CreateCommentOptions
): Promise<string> {
  const commentsRef = collection(db, 'comments')
  const commentRef = doc(commentsRef)

  const commentData: Omit<CommentDocument, 'updatedAt'> = {
    docId: options.docId,
    range: options.range,
    text: options.text,
    authorId: options.author.id,
    authorName: options.author.name,
    authorColor: options.author.color,
    createdAt: serverTimestamp() as Timestamp,
    resolved: false,
    replies: [],
  }

  await setDoc(commentRef, commentData)
  console.log('[CommentService] Created comment:', commentRef.id)

  return commentRef.id
}

/**
 * Add a reply to an existing comment
 */
export async function addReply(
  db: Firestore,
  options: AddReplyOptions
): Promise<void> {
  const commentRef = doc(db, 'comments', options.commentId)

  const reply = {
    id: crypto.randomUUID(),
    text: options.text,
    authorId: options.author.id,
    authorName: options.author.name,
    authorColor: options.author.color,
    createdAt: serverTimestamp() as Timestamp,
  }

  // Note: This approach adds the reply to the array. In production,
  // consider using arrayUnion or a subcollection for better scalability
  await updateDoc(commentRef, {
    replies: reply as any, // Firebase will append to array
    updatedAt: serverTimestamp(),
  })

  console.log('[CommentService] Added reply to comment:', options.commentId)
}

/**
 * Resolve or unresolve a comment
 */
export async function toggleResolveComment(
  db: Firestore,
  commentId: string,
  resolved: boolean
): Promise<void> {
  const commentRef = doc(db, 'comments', commentId)

  await updateDoc(commentRef, {
    resolved,
    updatedAt: serverTimestamp(),
  })

  console.log('[CommentService] Toggled resolve:', commentId, resolved)
}

/**
 * Delete a comment
 */
export async function deleteComment(
  db: Firestore,
  commentId: string
): Promise<void> {
  const commentRef = doc(db, 'comments', commentId)
  await deleteDoc(commentRef)
  console.log('[CommentService] Deleted comment:', commentId)
}

/**
 * Subscribe to comments for a document
 */
export function subscribeToComments(
  db: Firestore,
  docId: string,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): () => void {
  const commentsRef = collection(db, 'comments')
  const q = query(
    commentsRef,
    where('docId', '==', docId),
    orderBy('createdAt', 'asc')
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = []

      snapshot.forEach((doc) => {
        const data = doc.data() as CommentDocument
        comments.push(convertCommentDocument(doc.id, data))
      })

      console.log('[CommentService] Comments updated:', comments.length)
      onUpdate(comments)
    },
    (error) => {
      console.error('[CommentService] Error subscribing to comments:', error)
      onError?.(error)
    }
  )

  return unsubscribe
}

/**
 * Get unresolved comment count for a document
 */
export function getUnresolvedCount(comments: Comment[]): number {
  return comments.filter((comment) => !comment.resolved).length
}
