import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { parseHtmlToSections, extractMetadata } from './serializers'

export interface PdfOptions {
  title?: string
  author?: string
  subject?: string
}

/**
 * Convert HTML to PDF buffer
 */
export async function htmlToPdf(html: string, options: PdfOptions = {}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const sections = parseHtmlToSections(html)
  const metadata = extractMetadata(html)

  // Set document metadata
  const title = options.title || metadata.title || 'Document'
  pdfDoc.setTitle(title)
  pdfDoc.setAuthor(options.author || 'Demand Letter Generator')
  if (options.subject) {
    pdfDoc.setSubject(options.subject)
  }
  pdfDoc.setCreationDate(new Date())

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Page settings
  const pageWidth = 612 // 8.5 inches * 72 points/inch
  const pageHeight = 792 // 11 inches * 72 points/inch
  const margin = 72 // 1 inch margins
  const contentWidth = pageWidth - 2 * margin

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let yPosition = pageHeight - margin

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition - requiredHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      yPosition = pageHeight - margin
      return true
    }
    return false
  }

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  // Don't render the document title in the PDF content

  // Render sections
  for (const section of sections) {
    if (section.type === 'heading') {
      const fontSize = section.level === 1 ? 16 : section.level === 2 ? 14 : 12
      const lines = wrapText(section.content, contentWidth, fontSize)

      for (const line of lines) {
        checkNewPage(fontSize + 5)
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: fontBold,
          color: rgb(0, 0, 0),
        })
        yPosition -= fontSize + 5
      }

      yPosition -= 5 // Extra spacing after heading
    } else if (section.type === 'paragraph') {
      const fontSize = 11
      const lineSpacing = fontSize + 3

      // Handle empty paragraphs (blank lines)
      if (!section.content || section.content.trim() === '') {
        // Create a visible blank line with the same height as a text line
        checkNewPage(lineSpacing)
        yPosition -= lineSpacing
      } else {
        const lines = wrapText(section.content, contentWidth, fontSize)

        for (const line of lines) {
          checkNewPage(lineSpacing)
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          })
          yPosition -= lineSpacing
        }
      }
    } else if (section.type === 'list' && section.items) {
      const fontSize = 11

      for (const item of section.items) {
        const bulletText = `• ${item}`
        const lines = wrapText(bulletText, contentWidth - 20, fontSize)

        for (let i = 0; i < lines.length; i++) {
          checkNewPage(fontSize + 3)
          const xOffset = i === 0 ? margin : margin + 15
          page.drawText(lines[i], {
            x: xOffset,
            y: yPosition,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          })
          yPosition -= fontSize + 3
        }
      }

      yPosition -= 5 // Extra spacing after list
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
