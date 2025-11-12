'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface NewCommentPopoverProps {
  onSubmit: (text: string) => Promise<void>
  onCancel: () => void
  open: boolean
  selectedText?: string
}

/**
 * Popover for creating a new comment on selected text
 */
export function NewCommentPopover({
  onSubmit,
  onCancel,
  open,
  selectedText,
}: NewCommentPopoverProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(text)
      setText('')
    } catch (error) {
      console.error('Failed to create comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setText('')
    onCancel()
  }

  return (
    <Popover open={open} onOpenChange={(open) => !open && handleCancel()}>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Add a comment</h4>
            {selectedText && (
              <div className="text-xs text-muted-foreground italic p-2 bg-muted rounded border-l-2 border-primary mb-2">
                "{selectedText}"
              </div>
            )}
          </div>

          <Textarea
            placeholder="Write your comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[80px]"
            autoFocus
          />

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
            >
              Comment
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
