import type { Timestamp } from 'firebase/firestore'

/**
 * Tone preset options for demand letters
 */
export type TonePreset = 'professional' | 'assertive' | 'empathetic' | 'custom'

/**
 * Template document structure
 */
export interface Template {
  id: string
  name: string
  description?: string
  tonePreset: TonePreset
  tonePrompt: string
  sections?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isDefault?: boolean
}

/**
 * Firestore template document (with Timestamp types)
 */
export interface TemplateDocument {
  name: string
  description?: string
  tonePreset: TonePreset
  tonePrompt: string
  sections?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  isDefault?: boolean
}

/**
 * Options for creating a template
 */
export interface CreateTemplateOptions {
  name: string
  description?: string
  tonePreset: TonePreset
  tonePrompt: string
  sections?: string[]
  createdBy: string
  isDefault?: boolean
}

/**
 * Options for updating a template
 */
export interface UpdateTemplateOptions {
  name?: string
  description?: string
  tonePreset?: TonePreset
  tonePrompt?: string
  sections?: string[]
}

/**
 * Refinement request options
 */
export interface RefinementOptions {
  docId: string
  instructions: string
  templateId?: string
  tonePreset?: TonePreset
}

/**
 * Default tone prompts
 */
export const DEFAULT_TONE_PROMPTS: Record<Exclude<TonePreset, 'custom'>, string> = {
  professional: `Maintain a professional, business-like tone. Use formal language and standard legal terminology. Be clear, direct, and respectful while asserting the client's position firmly.`,

  assertive: `Use a strong, confident tone that clearly communicates the seriousness of the matter. Be direct and firm in stating demands and consequences. Emphasize urgency and the client's determination to pursue all available remedies.`,

  empathetic: `Adopt a understanding yet firm tone. Acknowledge the complexity of the situation while clearly stating the client's position. Balance professionalism with a human touch, showing willingness to resolve matters amicably while maintaining clear boundaries.`,
}

/**
 * Tone preset labels
 */
export const TONE_PRESET_LABELS: Record<TonePreset, string> = {
  professional: 'Professional',
  assertive: 'Assertive',
  empathetic: 'Empathetic',
  custom: 'Custom',
}

/**
 * Tone preset descriptions
 */
export const TONE_PRESET_DESCRIPTIONS: Record<TonePreset, string> = {
  professional: 'Formal, business-like tone with standard legal terminology',
  assertive: 'Strong, confident tone emphasizing urgency and determination',
  empathetic: 'Understanding yet firm, balancing professionalism with human touch',
  custom: 'Define your own custom tone and style',
}
