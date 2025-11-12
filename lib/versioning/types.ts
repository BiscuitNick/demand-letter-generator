import type { Timestamp } from 'firebase/firestore'

/**
 * Document version metadata
 */
export interface DocumentVersion {
  version: number
  createdAt: Date
  updatedAt: Date
}

/**
 * History entry stored in subcollection
 */
export interface HistoryEntry {
  id: string
  version: number
  timestamp: Date
  authorId: string
  authorName: string
  diffSummary: string
  changeType: 'create' | 'edit' | 'clone' | 'refine' | 'export'
  contentSnapshot?: string // Optional snapshot of content at this version
}

/**
 * Firestore document for history entry
 */
export interface HistoryEntryDocument {
  version: number
  timestamp: Timestamp
  authorId: string
  authorName: string
  diffSummary: string
  changeType: 'create' | 'edit' | 'clone' | 'refine' | 'export'
  contentSnapshot?: string
}

/**
 * Clone document options
 */
export interface CloneDocumentOptions {
  docId: string
  newTitle?: string
  userId: string
  userName: string
  includeComments?: boolean
  includeHistory?: boolean
}

/**
 * Clone result
 */
export interface CloneResult {
  newDocId: string
  sourceVersion: number
  newVersion: number
}
