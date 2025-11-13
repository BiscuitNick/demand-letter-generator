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
import { Check, X, ChevronDown, ChevronUp, Briefcase, Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLawyers } from '@/lib/lawyers/hooks/useLawyers'
import { db } from '@/lib/firebase-client'
import {
  matchPlaceholderToField,
  getAllLawyerFieldOptions,
  formatFieldName,
} from '@/lib/lawyers/utils'
import type { LawyerFieldOption, Lawyer } from '@/lib/lawyers/types'

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
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('')
  const { lawyers } = useLawyers(db)

  // Smart match the placeholder to a field
  const matchedField = matchPlaceholderToField(placeholderText)

  // Check if this is a date placeholder
  const isDatePlaceholder = /date/i.test(placeholderText)

  // Get the selected lawyer
  const selectedLawyer = lawyers.find((l) => l.id === selectedLawyerId)

  // Get matched field value for selected lawyer
  const matchedFieldValue = selectedLawyer && matchedField
    ? selectedLawyer[matchedField]
    : null

  // Format today's date
  const getTodaysDate = () => {
    const today = new Date()
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleUseTodaysDate = () => {
    onUpdate(placeholderId, getTodaysDate())
    onClose()
  }

  useEffect(() => {
    if (open) {
      setValue(placeholderText)
      setShowAllFields(false)
      // Auto-select first lawyer if available
      if (lawyers.length > 0 && !selectedLawyerId) {
        setSelectedLawyerId(lawyers[0].id!)
      }
    }
  }, [open, placeholderText, lawyers, selectedLawyerId])

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
          {/* Today's Date Section */}
          {isDatePlaceholder && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Quick Date
              </Label>
              <button
                onClick={handleUseTodaysDate}
                className="w-full text-left px-4 py-3 rounded-md border bg-card hover:bg-accent transition-colors"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  Today's Date
                </div>
                <div className="font-medium">{getTodaysDate()}</div>
              </button>
            </div>
          )}

          {/* Lawyer Selection Section */}
          {lawyers.length > 0 && (
            <div className="space-y-3">
              {/* Lawyer Selector */}
              <div className="space-y-2">
                <Label htmlFor="lawyer-select" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Select Lawyer
                </Label>
                <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                  <SelectTrigger id="lawyer-select">
                    <SelectValue placeholder="Choose a lawyer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lawyers.map((lawyer) => (
                      <SelectItem key={lawyer.id} value={lawyer.id!}>
                        {lawyer.name}
                        {lawyer.lawfirm && (
                          <span className="text-muted-foreground ml-2">
                            • {lawyer.lawfirm}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show matched field or all fields */}
              {selectedLawyer && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      {matchedField && !showAllFields
                        ? `Suggested: ${formatFieldName(matchedField)}`
                        : 'All Fields'}
                    </Label>
                    {matchedField && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllFields(!showAllFields)}
                        className="text-xs"
                      >
                        {showAllFields ? (
                          <>
                            Show Suggestion
                            <ChevronUp className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          <>
                            Show All Fields
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Smart matched field */}
                  {!showAllFields && matchedField && matchedFieldValue && (
                    <button
                      onClick={() => handleSelectOption({
                        lawyerId: selectedLawyer.id!,
                        field: matchedField,
                        value: matchedFieldValue as string,
                        lawyerName: selectedLawyer.name,
                      })}
                      className="w-full text-left px-4 py-3 rounded-md border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatFieldName(matchedField)}
                      </div>
                      <div className="font-medium">{matchedFieldValue as string}</div>
                    </button>
                  )}

                  {/* No matched field value */}
                  {!showAllFields && matchedField && !matchedFieldValue && (
                    <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                      No {formatFieldName(matchedField).toLowerCase()} for this lawyer.
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

                  {/* All fields view */}
                  {(showAllFields || !matchedField) && (
                    <div className="max-h-[250px] overflow-y-auto space-y-1 border rounded-md p-2">
                      {getAllLawyerFieldOptions(selectedLawyer).map((option) => (
                        <button
                          key={`${option.lawyerId}-${option.field}`}
                          onClick={() => handleSelectOption(option)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatFieldName(option.field)}:
                            </span>
                            <span className="text-sm font-medium truncate">
                              {option.value}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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
