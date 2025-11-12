import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type {
  HistoryEntry,
  HistoryEntryDocument,
} from './types'

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate()
}

/**
 * Convert Firestore history document to HistoryEntry
 */
function convertHistoryDocument(id: string, data: HistoryEntryDocument): HistoryEntry {
  return {
    id,
    version: data.version,
    timestamp: timestampToDate(data.timestamp),
    authorId: data.authorId,
    authorName: data.authorName,
    diffSummary: data.diffSummary,
    changeType: data.changeType,
    contentSnapshot: data.contentSnapshot,
  }
}

/**
 * Create a new history entry
 */
export async function createHistoryEntry(
  db: Firestore,
  docId: string,
  entry: Omit<HistoryEntry, 'id' | 'timestamp'>
): Promise<string> {
  const historyRef = collection(db, 'documents', docId, 'history')

  const historyData: Omit<HistoryEntryDocument, 'timestamp'> & { timestamp: any } = {
    version: entry.version,
    timestamp: serverTimestamp(),
    authorId: entry.authorId,
    authorName: entry.authorName,
    diffSummary: entry.diffSummary,
    changeType: entry.changeType,
    contentSnapshot: entry.contentSnapshot,
  }

  const docRef = await addDoc(historyRef, historyData)
  console.log('[VersioningService] Created history entry:', docRef.id)

  return docRef.id
}

/**
 * Get document history
 */
export async function getDocumentHistory(
  db: Firestore,
  docId: string,
  limitCount: number = 50
): Promise<HistoryEntry[]> {
  const historyRef = collection(db, 'documents', docId, 'history')
  const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount))

  const snapshot = await getDocs(q)
  const history: HistoryEntry[] = []

  snapshot.forEach((doc) => {
    const data = doc.data() as HistoryEntryDocument
    history.push(convertHistoryDocument(doc.id, data))
  })

  console.log('[VersioningService] Retrieved history:', history.length, 'entries')
  return history
}

/**
 * Get a specific history entry
 */
export async function getHistoryEntry(
  db: Firestore,
  docId: string,
  historyId: string
): Promise<HistoryEntry | null> {
  const historyRef = doc(db, 'documents', docId, 'history', historyId)
  const snapshot = await getDoc(historyRef)

  if (!snapshot.exists()) {
    console.log('[VersioningService] History entry not found:', historyId)
    return null
  }

  const data = snapshot.data() as HistoryEntryDocument
  return convertHistoryDocument(snapshot.id, data)
}

/**
 * Get the current version of a document
 */
export async function getCurrentVersion(
  db: Firestore,
  docId: string
): Promise<number> {
  const docRef = doc(db, 'documents', docId)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    throw new Error('Document not found')
  }

  const data = snapshot.data()
  return data.version || 1
}

/**
 * Generate a diff summary (mock implementation - replace with AI)
 */
export async function generateDiffSummary(
  oldContent: string,
  newContent: string
): Promise<string> {
  // Mock implementation - in production, use AI to generate meaningful diffs
  const oldLength = oldContent.length
  const newLength = newContent.length
  const diff = newLength - oldLength

  if (diff > 0) {
    return `Added ${diff} characters`
  } else if (diff < 0) {
    return `Removed ${Math.abs(diff)} characters`
  } else {
    return 'Minor edits'
  }
}
