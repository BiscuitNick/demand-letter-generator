'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, X } from 'lucide-react'

interface PlaceholderDialogProps {
  open: boolean
  placeholderId: string
  placeholderText: string
  onUpdate: (id: string, newText: string) => void
  onClose: () => void
}

/**
 * Dialog component for editing placeholder text.
 * Appears when clicking on a bracketed placeholder in the editor.
 */
export function PlaceholderDialog({
  open,
  placeholderId,
  placeholderText,
  onUpdate,
  onClose,
}: PlaceholderDialogProps) {
  const [value, setValue] = useState(placeholderText)

  useEffect(() => {
    if (open) {
      setValue(placeholderText)
    }
  }, [open, placeholderText])

  const handleSave = () => {
    if (value.trim()) {
      onUpdate(placeholderId, value.trim())
      onClose()
    }
  }

  const handleCancel = () => {
    setValue(placeholderText)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Placeholder</DialogTitle>
          <DialogDescription>
            Replace <span className="font-mono text-amber-600">[{placeholderText}]</span> with your text.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="placeholder-input">Replacement Text</Label>
            <Input
              id="placeholder-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter replacement text..."
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!value.trim()}
          >
            <Check className="h-4 w-4 mr-1" />
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
