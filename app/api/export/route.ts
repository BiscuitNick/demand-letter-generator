import { NextRequest, NextResponse } from 'next/server'
import { htmlToPdf } from '@/lib/export/pdf-renderer'
import { htmlToDocx } from '@/lib/export/docx-renderer'
import { htmlToPlaintext } from '@/lib/export/serializers'
import { requireAuth } from '@/lib/auth-helpers'
import { getAdminDb } from '@/lib/firebase-admin'

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
    // Require authentication
    const user = await requireAuth(request)

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
    const db = getAdminDb()

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

    // Convert plain text to HTML if needed
    // The export functions expect HTML, so wrap plain text in basic HTML structure
    const htmlContent = content.includes('<') && content.includes('>')
      ? content // Already HTML
      : `<div>${content.split('\n\n').map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>` // Convert plain text to HTML

    // Export based on format
    let buffer: Buffer
    let contentType: string

    switch (format) {
      case 'docx':
        buffer = await htmlToDocx(htmlContent, {
          title: docData?.title,
          author: user.email || docData?.author,
          description: docData?.description,
        })
        contentType = CONTENT_TYPES.docx
        break

      case 'pdf':
        buffer = await htmlToPdf(htmlContent, {
          title: docData?.title,
          author: user.email || docData?.author,
          subject: docData?.subject,
        })
        contentType = CONTENT_TYPES.pdf
        break

      case 'txt':
        // For plain text, just use the original content directly
        buffer = Buffer.from(content, 'utf-8')
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
