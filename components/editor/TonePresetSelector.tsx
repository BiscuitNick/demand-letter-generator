'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  TONE_PRESET_LABELS,
  TONE_PRESET_DESCRIPTIONS,
  type TonePreset,
} from '@/lib/templates/types'

interface TonePresetSelectorProps {
  onRefine: (tonePreset: TonePreset, instructions?: string) => Promise<void>
  disabled?: boolean
}

/**
 * Tone preset selector with refinement trigger
 */
export function TonePresetSelector({ onRefine, disabled }: TonePresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTone, setSelectedTone] = useState<TonePreset>('professional')
  const [customInstructions, setCustomInstructions] = useState('')
  const [isRefining, setIsRefining] = useState(false)

  const handleRefine = async () => {
    setIsRefining(true)
    try {
      await onRefine(
        selectedTone,
        customInstructions.trim() || undefined
      )
      setIsOpen(false)
      setCustomInstructions('')
    } catch (error) {
      console.error('Refinement error:', error)
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Sparkles className="h-4 w-4 mr-2" />
          Refine Tone
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Refine Document Tone</h4>
            <p className="text-sm text-muted-foreground">
              Adjust the tone and style of your document without regenerating it.
            </p>
          </div>

          {/* Tone Preset Selector */}
          <div className="space-y-2">
            <Label>Tone Preset</Label>
            <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as TonePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TONE_PRESET_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {TONE_PRESET_DESCRIPTIONS[value as TonePreset]}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Emphasize specific legal points, add more urgency, soften certain sections..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOpen(false)
                setCustomInstructions('')
              }}
              disabled={isRefining}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleRefine} disabled={isRefining}>
              {isRefining ? 'Refining...' : 'Apply Refinement'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
