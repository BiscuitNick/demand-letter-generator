'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_TONE_PROMPTS,
  TONE_PRESET_LABELS,
  TONE_PRESET_DESCRIPTIONS,
  type TonePreset,
  type Template,
} from '@/lib/templates/types'

interface TemplateFormProps {
  template?: Template
  onSubmit: (data: TemplateFormData) => Promise<void>
  onCancel: () => void
}

export interface TemplateFormData {
  name: string
  description?: string
  tonePreset: TonePreset
  tonePrompt: string
  isDefault?: boolean
}

/**
 * Form for creating/editing templates
 */
export function TemplateForm({ template, onSubmit, onCancel }: TemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTone, setSelectedTone] = useState<TonePreset>(
    template?.tonePreset || 'professional'
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateFormData>({
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      tonePreset: template?.tonePreset || 'professional',
      tonePrompt: template?.tonePrompt || DEFAULT_TONE_PROMPTS.professional,
      isDefault: template?.isDefault || false,
    },
  })

  const tonePrompt = watch('tonePrompt')

  const handleToneChange = (value: TonePreset) => {
    setSelectedTone(value)
    setValue('tonePreset', value)

    if (value !== 'custom') {
      setValue('tonePrompt', DEFAULT_TONE_PROMPTS[value])
    }
  }

  const onFormSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Template Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name', { required: 'Template name is required' })}
          placeholder="e.g., Professional Demand Letter"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Brief description of this template..."
          rows={2}
        />
      </div>

      {/* Tone Preset */}
      <div className="space-y-2">
        <Label htmlFor="tonePreset">
          Tone Preset <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedTone} onValueChange={handleToneChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a tone" />
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

      {/* Tone Prompt */}
      <div className="space-y-2">
        <Label htmlFor="tonePrompt">
          Tone Instructions <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="tonePrompt"
          {...register('tonePrompt', { required: 'Tone instructions are required' })}
          placeholder="Describe the tone and style for this template..."
          rows={4}
          disabled={selectedTone !== 'custom'}
          className={selectedTone !== 'custom' ? 'bg-muted' : ''}
        />
        {errors.tonePrompt && (
          <p className="text-sm text-destructive">{errors.tonePrompt.message}</p>
        )}
        {selectedTone !== 'custom' && (
          <p className="text-xs text-muted-foreground">
            Using default prompt for {TONE_PRESET_LABELS[selectedTone]} tone. Select
            "Custom" to edit.
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  )
}
