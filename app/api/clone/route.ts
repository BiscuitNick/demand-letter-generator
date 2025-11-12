import { NextRequest, NextResponse } from 'next/server'
import type { CloneDocumentOptions, CloneResult } from '@/lib/versioning/types'

// Lazy load admin DB to avoid initialization issues during build
function getDb() {
  try {
    const { getAdminDb } = require('@/lib/firebase-admin')
    return getAdminDb()
  } catch (error) {
    console.error('[API Clone] Firebase Admin not configured:', error)
    return null
  }
}

/**
 * POST /api/clone
 *
 * Clones a document with all its metadata, incrementing version and creating a new draft.
 *
 * Body:
 * {
 *   docId: string
 *   newTitle?: string
 *   userId: string
 *   userName: string
 *   includeComments?: boolean
 *   includeHistory?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CloneDocumentOptions
    const {
      docId,
      newTitle,
      userId,
      userName,
      includeComments = false,
      includeHistory = false,
    } = body

    if (!docId) {
      return NextResponse.json(
        { error: 'docId is required' },
        { status: 400 }
      )
    }

    if (!userId || !userName) {
      return NextResponse.json(
        { error: 'userId and userName are required' },
        { status: 400 }
      )
    }

    // Get database instance
    const db = getDb()
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 500 }
      )
    }

    // Dynamic import for FieldValue
    const { FieldValue } = await import('firebase-admin/firestore')

    // Get the source document
    const sourceRef = db.collection('documents').doc(docId)
    const sourceSnapshot = await sourceRef.get()

    if (!sourceSnapshot.exists) {
      return NextResponse.json(
        { error: 'Source document not found' },
        { status: 404 }
      )
    }

    const sourceData = sourceSnapshot.data()
    const sourceVersion = sourceData?.version || 1

    // Create new document reference
    const newDocRef = db.collection('documents').doc()

    // Prepare cloned data
    const clonedData: any = {
      // Basic metadata
      title: newTitle || `${sourceData?.title || 'Document'} (Copy)`,
      status: 'draft',

      // Content
      content: sourceData?.content || '',
      draft: sourceData?.draft || '',

      // Version info
      version: 1, // Start at version 1 for clone

      // Author info
      createdBy: userId,
      createdByName: userName,

      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),

      // Collaborators (reset to just the cloner)
      collaborators: [{
        id: userId,
        name: userName,
        role: 'owner',
        addedAt: FieldValue.serverTimestamp(),
      }],

      // Copy other metadata if present
      description: sourceData?.description,
      tags: sourceData?.tags || [],
      templateId: sourceData?.templateId,

      // Clone metadata
      clonedFrom: docId,
      clonedFromVersion: sourceVersion,
      clonedAt: FieldValue.serverTimestamp(),
    }

    // Create the cloned document
    await newDocRef.set(clonedData)

    // Create initial history entry for the clone
    const historyRef = newDocRef.collection('history').doc()
    await historyRef.set({
      version: 1,
      timestamp: FieldValue.serverTimestamp(),
      authorId: userId,
      authorName: userName,
      diffSummary: `Cloned from document ${docId} (version ${sourceVersion})`,
      changeType: 'clone',
    })

    // Optionally copy comments
    if (includeComments) {
      const sourceCommentsRef = sourceRef.collection('comments')
      const sourceCommentsSnapshot = await sourceCommentsRef.get()

      if (!sourceCommentsSnapshot.empty) {
        const batch = db.batch()
        sourceCommentsSnapshot.forEach((commentDoc: any) => {
          const commentData = commentDoc.data()
          const newCommentRef = newDocRef.collection('comments').doc()
          batch.set(newCommentRef, {
            ...commentData,
            createdAt: FieldValue.serverTimestamp(),
          })
        })
        await batch.commit()
      }
    }

    // Optionally copy history
    if (includeHistory) {
      const sourceHistoryRef = sourceRef.collection('history')
      const sourceHistorySnapshot = await sourceHistoryRef.get()

      if (!sourceHistorySnapshot.empty) {
        const batch = db.batch()
        sourceHistorySnapshot.forEach((historyDoc: any) => {
          const historyData = historyDoc.data()
          const newHistoryRef = newDocRef.collection('history').doc()
          batch.set(newHistoryRef, historyData)
        })
        await batch.commit()
      }
    }

    console.log('[API Clone] Successfully cloned document:', docId, '→', newDocRef.id)

    const result: CloneResult = {
      newDocId: newDocRef.id,
      sourceVersion,
      newVersion: 1,
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Document cloned successfully',
    })
  } catch (error) {
    console.error('[API Clone] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to clone document',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
