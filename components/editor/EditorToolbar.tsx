'use client'

import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Type,
  ChevronDown,
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface EditorToolbarProps {
  editor: Editor | null
}

/**
 * Rich text formatting toolbar for Tiptap editor.
 * Provides controls for bold, italic, lists, headings, and undo/redo.
 * Buttons are disabled when actions are unavailable based on editor state.
 */
export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const handleHeadingChange = (level: 1 | 2 | 3) => {
    requestAnimationFrame(() => {
      editor.chain().focus().toggleHeading({ level }).run()
    })
  }

  const handleParagraph = () => {
    requestAnimationFrame(() => {
      editor.chain().focus().setParagraph().run()
    })
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b bg-background p-2"
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      {/* Text Style Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            aria-label="Text style"
          >
            <Type className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={handleParagraph}
            className="gap-2"
          >
            <Type className="h-4 w-4" />
            <span>Paragraph</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleHeadingChange(1)}
            className="gap-2"
          >
            <Heading1 className="h-4 w-4" />
            <span>Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleHeadingChange(2)}
            className="gap-2"
          >
            <Heading2 className="h-4 w-4" />
            <span>Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleHeadingChange(3)}
            className="gap-2"
          >
            <Heading3 className="h-4 w-4" />
            <span>Heading 3</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-8" />

      {/* Bold */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => {
          requestAnimationFrame(() => {
            editor.chain().focus().toggleBold().run()
          })
        }}
        disabled={!editor.can().toggleBold()}
        aria-label="Toggle bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      {/* Italic */}
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => {
          requestAnimationFrame(() => {
            editor.chain().focus().toggleItalic().run()
          })
        }}
        disabled={!editor.can().toggleItalic()}
        aria-label="Toggle italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-8" />

      {/* Bullet List */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => {
          requestAnimationFrame(() => {
            editor.chain().focus().toggleBulletList().run()
          })
        }}
        disabled={!editor.can().toggleBulletList()}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>

      {/* Ordered List */}
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => {
          requestAnimationFrame(() => {
            editor.chain().focus().toggleOrderedList().run()
          })
        }}
        disabled={!editor.can().toggleOrderedList()}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-8" />

      {/* Undo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          requestAnimationFrame(() => {
            editor.chain().focus().undo().run()
          })
        }}
        disabled={!editor.can().undo()}
        aria-label="Undo (Ctrl+Z)"
        className="h-8 w-8 p-0"
      >
        <Undo className="h-4 w-4" />
      </Button>

      {/* Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          requestAnimationFrame(() => {
            editor.chain().focus().redo().run()
          })
        }}
        disabled={!editor.can().redo()}
        aria-label="Redo (Ctrl+Y)"
        className="h-8 w-8 p-0"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}
