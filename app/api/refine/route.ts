import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_TONE_PROMPTS, type TonePreset } from '@/lib/templates/types'

// Lazy load admin DB to avoid initialization issues during build
function getDb() {
  try {
    const { getAdminDb } = require('@/lib/firebase-admin')
    return getAdminDb()
  } catch (error) {
    console.error('[API Refine] Firebase Admin not configured:', error)
    return null
  }
}

// Mock OpenAI call - replace with actual OpenAI integration
async function refineWithAI(
  currentContent: string,
  tonePrompt: string,
  customInstructions?: string
): Promise<string> {
  // In production, call OpenAI GPT-4o here
  // For now, return a mock refined version
  console.log('[API Refine] Mock AI refinement with tone:', tonePrompt)

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock response - in production, this would be the AI-refined content
  return `[REFINED with ${customInstructions || 'default tone'}]\n\n${currentContent}`
}

/**
 * POST /api/refine
 *
 * Refines document content using AI based on tone preset and custom instructions.
 *
 * Body:
 * {
 *   docId: string
 *   tonePreset?: TonePreset
 *   templateId?: string
 *   instructions?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { docId, tonePreset, templateId, instructions } = body

    if (!docId) {
      return NextResponse.json(
        { error: 'docId is required' },
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

    // Get the document
    const docRef = db.collection('documents').doc(docId)
    const docSnapshot = await docRef.get()

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const docData = docSnapshot.data()
    const currentContent = docData?.content || docData?.draft || ''

    if (!currentContent) {
      return NextResponse.json(
        { error: 'Document has no content to refine' },
        { status: 400 }
      )
    }

    // Get tone prompt
    let tonePrompt = ''

    if (tonePreset && tonePreset !== 'custom') {
      // Use default tone prompt
      tonePrompt = DEFAULT_TONE_PROMPTS[tonePreset as Exclude<TonePreset, 'custom'>]
    } else if (templateId) {
      // Load template from Firestore
      try {
        const templateRef = db.collection('templates').doc(templateId)
        const templateSnap = await templateRef.get()

        if (templateSnap.exists) {
          const templateData = templateSnap.data()
          tonePrompt = templateData?.tonePrompt || ''
          console.log('[API Refine] Using template:', templateData?.name)
        } else {
          console.warn('[API Refine] Template not found:', templateId)
        }
      } catch (error) {
        console.error('[API Refine] Error loading template:', error)
      }
    }

    if (!tonePrompt && !instructions) {
      return NextResponse.json(
        { error: 'Either tonePreset, templateId, or instructions must be provided' },
        { status: 400 }
      )
    }

    // Build refinement prompt
    const refinementPrompt = [
      tonePrompt,
      instructions,
    ].filter(Boolean).join('\n\n')

    // Refine content using AI
    const refinedContent = await refineWithAI(
      currentContent,
      refinementPrompt,
      instructions
    )

    // Update document with refined content
    await docRef.update({
      content: refinedContent,
      updatedAt: FieldValue.serverTimestamp(),
      lastRefinement: {
        tonePreset: tonePreset || null,
        templateId: templateId || null,
        instructions: instructions || null,
        appliedAt: FieldValue.serverTimestamp(),
      },
    })

    console.log('[API Refine] Successfully refined document:', docId)

    return NextResponse.json({
      success: true,
      docId,
      message: 'Document refined successfully',
    })
  } catch (error) {
    console.error('[API Refine] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to refine document',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
