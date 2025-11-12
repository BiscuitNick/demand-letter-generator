import { convert } from 'html-to-text'
import { JSDOM } from 'jsdom'

/**
 * Convert HTML to plain text
 */
export function htmlToPlaintext(html: string): string {
  return convert(html, {
    wordwrap: 80,
    preserveNewlines: true,
    selectors: [
      { selector: 'h1', options: { uppercase: false } },
      { selector: 'h2', options: { uppercase: false } },
      { selector: 'h3', options: { uppercase: false } },
      { selector: 'a', options: { ignoreHref: true } },
    ],
  })
}

/**
 * Clean and normalize HTML for export
 */
export function normalizeHtml(html: string): string {
  // Remove editor-specific classes and attributes
  let normalized = html
    .replace(/class="[^"]*"/g, '')
    .replace(/data-[^=]*="[^"]*"/g, '')
    .replace(/contenteditable="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
}

/**
 * Extract document metadata from HTML
 */
export function extractMetadata(html: string): {
  title?: string
  headings: string[]
} {
  const headings: string[] = []
  let title: string | undefined

  // Extract first h1 as title
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/)
  if (h1Match) {
    title = h1Match[1].replace(/<[^>]*>/g, '').trim()
  }

  // Extract all headings
  const headingMatches = html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g)
  for (const match of headingMatches) {
    const heading = match[1].replace(/<[^>]*>/g, '').trim()
    if (heading) {
      headings.push(heading)
    }
  }

  return { title, headings }
}

/**
 * Parse HTML into structured sections
 */
export interface DocumentSection {
  type: 'paragraph' | 'heading' | 'list'
  level?: number
  content: string
  items?: string[]
}

export function parseHtmlToSections(html: string): DocumentSection[] {
  const sections: DocumentSection[] = []
  const normalized = normalizeHtml(html)

  // Use JSDOM for server-side HTML parsing
  const dom = new JSDOM(normalized)
  const doc = dom.window.document

  const processNode = (node: Node) => {
    if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
      const element = node as Element
      const tagName = element.tagName.toLowerCase()

      if (tagName.startsWith('h')) {
        const level = parseInt(tagName.charAt(1))
        sections.push({
          type: 'heading',
          level,
          content: element.textContent || '',
        })
      } else if (tagName === 'p') {
        const content = element.textContent?.trim()
        if (content) {
          sections.push({
            type: 'paragraph',
            content,
          })
        }
      } else if (tagName === 'ul' || tagName === 'ol') {
        const items: string[] = []
        element.querySelectorAll('li').forEach((li) => {
          const text = li.textContent?.trim()
          if (text) items.push(text)
        })
        if (items.length > 0) {
          sections.push({
            type: 'list',
            content: '',
            items,
          })
        }
      } else {
        // Recursively process children
        Array.from(element.childNodes).forEach(processNode)
      }
    }
  }

  Array.from(doc.body.childNodes).forEach(processNode)

  return sections
}
