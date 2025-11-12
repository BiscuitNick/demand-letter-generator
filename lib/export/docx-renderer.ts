import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx'
import { parseHtmlToSections, extractMetadata, type DocumentSection } from './serializers'

export interface DocxOptions {
  title?: string
  author?: string
  description?: string
}

/**
 * Convert HTML to DOCX buffer
 */
export async function htmlToDocx(html: string, options: DocxOptions = {}): Promise<Buffer> {
  const sections = parseHtmlToSections(html)
  const metadata = extractMetadata(html)

  const paragraphs: Paragraph[] = []

  // Don't add document title to the content

  // Convert sections to DOCX paragraphs
  for (const section of sections) {
    if (section.type === 'heading') {
      const headingLevel = getHeadingLevel(section.level || 1)
      paragraphs.push(
        new Paragraph({
          text: section.content,
          heading: headingLevel,
          spacing: {
            before: convertInchesToTwip(0.1),
            after: convertInchesToTwip(0.1),
          },
        })
      )
    } else if (section.type === 'paragraph') {
      // Handle empty paragraphs (blank lines)
      if (!section.content || section.content.trim() === '') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '',
              }),
            ],
            spacing: {
              after: convertInchesToTwip(0.1),
            },
          })
        )
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
              }),
            ],
            spacing: {
              after: convertInchesToTwip(0.1),
            },
          })
        )
      }
    } else if (section.type === 'list' && section.items) {
      // Add list items as paragraphs with bullets
      for (const item of section.items) {
        paragraphs.push(
          new Paragraph({
            text: `• ${item}`,
            spacing: {
              after: convertInchesToTwip(0.05),
            },
            indent: {
              left: convertInchesToTwip(0.5),
            },
          })
        )
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
    creator: options.author || 'Demand Letter Generator',
    title: options.title || undefined,
    description: options.description,
  })

  return await Packer.toBuffer(doc)
}

/**
 * Map heading level to DOCX HeadingLevel
 */
function getHeadingLevel(level: number) {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1
    case 2:
      return HeadingLevel.HEADING_2
    case 3:
      return HeadingLevel.HEADING_3
    case 4:
      return HeadingLevel.HEADING_4
    case 5:
      return HeadingLevel.HEADING_5
    case 6:
      return HeadingLevel.HEADING_6
    default:
      return HeadingLevel.HEADING_1
  }
}
