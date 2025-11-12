import { NextRequest, NextResponse } from 'next/server'
import { htmlToPdf } from '@/lib/export/pdf-renderer'
import { htmlToDocx } from '@/lib/export/docx-renderer'
import { htmlToPlaintext } from '@/lib/export/serializers'

// Lazy load admin DB to avoid initialization issues during build
function getDb() {
  try {
    const { getAdminDb } = require('@/lib/firebase-admin')
    return getAdminDb()
  } catch (error) {
    console.error('[API Export] Firebase Admin not configured:', error)
    return null
  }
}

type ExportFormat = 'docx' | 'pdf' | 'txt'

const CONTENT_TYPES: Record<ExportFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  txt: 'text/plain',
}

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  docx: '.docx',
  pdf: '.pdf',
  txt: '.txt',
}

/**
 * GET /api/export?docId={id}&format={docx|pdf|txt}
 *
 * Exports a document in the requested format.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const docId = searchParams.get('docId')
    const format = searchParams.get('format') as ExportFormat

    // Validate parameters
    if (!docId) {
      return NextResponse.json(
        { error: 'docId query parameter is required' },
        { status: 400 }
      )
    }

    if (!format || !['docx', 'pdf', 'txt'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be one of: docx, pdf, txt' },
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

    // Fetch document from Firestore
    const docRef = db.collection('documents').doc(docId)
    const docSnapshot = await docRef.get()

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const docData = docSnapshot.data()
    const content = docData?.content || docData?.draft || ''

    if (!content) {
      return NextResponse.json(
        { error: 'Document has no content to export' },
        { status: 400 }
      )
    }

    // Generate filename
    const title = docData?.title || 'document'
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const filename = `${sanitizedTitle}${FILE_EXTENSIONS[format]}`

    // Export based on format
    let buffer: Buffer
    let contentType: string

    switch (format) {
      case 'docx':
        buffer = await htmlToDocx(content, {
          title: docData?.title,
          author: docData?.author,
          description: docData?.description,
        })
        contentType = CONTENT_TYPES.docx
        break

      case 'pdf':
        buffer = await htmlToPdf(content, {
          title: docData?.title,
          author: docData?.author,
          subject: docData?.subject,
        })
        contentType = CONTENT_TYPES.pdf
        break

      case 'txt':
        const plaintext = htmlToPlaintext(content)
        buffer = Buffer.from(plaintext, 'utf-8')
        contentType = CONTENT_TYPES.txt
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        )
    }

    console.log('[API Export] Exported document:', docId, 'as', format)

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer)

    // Return file with proper headers
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[API Export] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to export document',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
