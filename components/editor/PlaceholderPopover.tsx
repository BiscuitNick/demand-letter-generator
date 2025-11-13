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
import { Check, X, ChevronDown, ChevronUp, Briefcase } from 'lucide-react'
import { useLawyers } from '@/lib/lawyers/hooks/useLawyers'
import { db } from '@/lib/firebase-client'
import {
  matchPlaceholderToField,
  getLawyerFieldOptions,
  getAllLawyerFieldOptions,
  formatFieldName,
} from '@/lib/lawyers/utils'
import type { LawyerFieldOption } from '@/lib/lawyers/types'

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
  const [showAllFields, setShowAllFields] = useState(false)
  const { lawyers } = useLawyers(db)

  // Smart match the placeholder to a field
  const matchedField = matchPlaceholderToField(placeholderText)

  // Get lawyer options based on matched field
  const lawyerOptions: LawyerFieldOption[] = matchedField
    ? getLawyerFieldOptions(lawyers, matchedField)
    : []

  useEffect(() => {
    if (open) {
      setValue(placeholderText)
      setShowAllFields(false)
    }
  }, [open, placeholderText])

  const handleSave = () => {
    if (value.trim()) {
      onUpdate(placeholderId, value.trim())
      onClose()
    }
  }

  const handleSelectOption = (option: LawyerFieldOption) => {
    onUpdate(placeholderId, option.value)
    onClose()
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
          {/* Lawyer Options Section */}
          {lawyers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {matchedField
                    ? `Suggested: ${formatFieldName(matchedField)}`
                    : 'Lawyer Information'}
                </Label>
                {!showAllFields && lawyers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllFields(true)}
                    className="text-xs"
                  >
                    Show All Fields
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                )}
                {showAllFields && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllFields(false)}
                    className="text-xs"
                  >
                    Hide
                    <ChevronUp className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Smart matched options */}
              {!showAllFields && lawyerOptions.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-md p-2">
                  {lawyerOptions.map((option) => (
                    <button
                      key={`${option.lawyerId}-${option.field}`}
                      onClick={() => handleSelectOption(option)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="font-medium text-sm">{option.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.lawyerName}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* All fields view */}
              {showAllFields && (
                <div className="max-h-[300px] overflow-y-auto space-y-3 border rounded-md p-2">
                  {lawyers.map((lawyer) => {
                    const allOptions = getAllLawyerFieldOptions(lawyer)
                    return (
                      <div key={lawyer.id} className="space-y-1">
                        <div className="font-medium text-sm px-2 py-1 bg-muted rounded">
                          {lawyer.name}
                        </div>
                        {allOptions.map((option) => (
                          <button
                            key={`${option.lawyerId}-${option.field}`}
                            onClick={() => handleSelectOption(option)}
                            className="w-full text-left px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">
                                {formatFieldName(option.field)}:
                              </span>
                              <span className="text-sm font-medium ml-2">
                                {option.value}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {!showAllFields && lawyerOptions.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                  No matching lawyer data found.
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllFields(true)}
                    className="ml-1"
                  >
                    Show all fields
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Manual Input Section */}
          <div className="space-y-2">
            <Label htmlFor="placeholder-input">Or Enter Manually</Label>
            <Input
              id="placeholder-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter replacement text..."
              autoFocus={lawyers.length === 0}
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
