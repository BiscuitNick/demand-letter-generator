'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { PlaceholderMark } from '@/lib/editor/extensions/placeholder-mark'
import { PlaceholderDialog } from './PlaceholderPopover'
import type { Editor } from '@tiptap/react'

interface DraftEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
}

/**
 * Draft editor with support for clickable bracketed placeholders.
 * Automatically detects [PLACEHOLDER] syntax and makes them editable.
 */
export function DraftEditor({ content, onChange, className }: DraftEditorProps) {
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<{
    id: string
    text: string
    element: HTMLElement
  } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      PlaceholderMark,
    ],
    content: processContentWithPlaceholders(content),
    editorProps: {
      attributes: {
        class: className || 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection
      editor.commands.setContent(processContentWithPlaceholders(content), false)
      // Restore cursor position if possible
      if (from === to) {
        editor.commands.setTextSelection({ from, to })
      }
    }
  }, [content, editor])

  // Handle placeholder clicks
  useEffect(() => {
    if (!editor) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const placeholderElement = target.closest('[data-type="placeholder"]') as HTMLElement

      if (placeholderElement) {
        const id = placeholderElement.getAttribute('data-placeholder-id')
        const text = placeholderElement.getAttribute('data-placeholder-text')

        if (id && text) {
          setSelectedPlaceholder({
            id,
            text,
            element: placeholderElement,
          })
        }
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('click', handleClick)

    return () => {
      editorElement.removeEventListener('click', handleClick)
    }
  }, [editor])

  const handleUpdatePlaceholder = useCallback(
    (id: string, newText: string) => {
      if (!editor) return

      // Find and replace the placeholder text
      const { doc } = editor.state
      let found = false

      doc.descendants((node, pos) => {
        if (found) return false

        if (node.isText) {
          node.marks.forEach((mark) => {
            if (mark.type.name === 'placeholderMark' && mark.attrs.id === id) {
              // Replace the entire bracketed placeholder with just the new text
              const from = pos
              const to = pos + node.nodeSize

              editor
                .chain()
                .focus()
                .setTextSelection({ from, to })
                .insertContent(newText)
                .run()

              found = true
            }
          })
        }
      })

      setSelectedPlaceholder(null)
    },
    [editor]
  )

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="relative border rounded-lg">
        <EditorContent editor={editor} />
      </div>
      {selectedPlaceholder && (
        <PlaceholderDialog
          open={!!selectedPlaceholder}
          placeholderId={selectedPlaceholder.id}
          placeholderText={selectedPlaceholder.text}
          onUpdate={handleUpdatePlaceholder}
          onClose={() => setSelectedPlaceholder(null)}
        />
      )}
      <style jsx global>{`
        .placeholder-mark {
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 3px;
          padding: 2px 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .placeholder-mark:hover {
          background-color: #fde68a;
        }

        .dark .placeholder-mark {
          background-color: #451a03;
          border-color: #78350f;
        }

        .dark .placeholder-mark:hover {
          background-color: #78350f;
        }
      `}</style>
    </>
  )
}

/**
 * Process content to wrap bracketed placeholders with placeholder marks.
 * Converts [PLACEHOLDER] to marked spans with unique IDs.
 * Also handles converting plain text line breaks to HTML.
 */
function processContentWithPlaceholders(content: string): string {
  if (!content) return ''

  let processedContent = content

  // Check if content is already HTML (contains HTML tags)
  const isHtml = /<[^>]+>/.test(content)

  if (!isHtml) {
    // Convert plain text to HTML paragraphs
    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/)
    processedContent = paragraphs
      .map((para) => {
        // Replace single newlines with <br> within paragraphs
        const withBreaks = para.replace(/\n/g, '<br>')
        return `<p>${withBreaks}</p>`
      })
      .join('')
  }

  // Now wrap placeholders
  const placeholderRegex = /\[([^\]]+)\]/g
  let match
  const replacements: Array<{ original: string; replacement: string }> = []

  // Reset regex lastIndex
  placeholderRegex.lastIndex = 0

  while ((match = placeholderRegex.exec(processedContent)) !== null) {
    const fullMatch = match[0]
    const innerText = match[1]
    const id = `placeholder-${Math.random().toString(36).substr(2, 9)}`

    const replacement = `<span data-type="placeholder" data-placeholder-id="${id}" data-placeholder-text="${innerText}" class="placeholder-mark">${fullMatch}</span>`

    replacements.push({ original: fullMatch, replacement })
  }

  // Apply replacements (only first occurrence to avoid issues with duplicates)
  replacements.forEach(({ original, replacement }) => {
    processedContent = processedContent.replace(original, replacement)
  })

  return processedContent
}
