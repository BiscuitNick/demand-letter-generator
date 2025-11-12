// Types
export type {
  Template,
  TemplateDocument,
  TonePreset,
  CreateTemplateOptions,
  UpdateTemplateOptions,
  RefinementOptions,
} from './types'

export {
  DEFAULT_TONE_PROMPTS,
  TONE_PRESET_LABELS,
  TONE_PRESET_DESCRIPTIONS,
} from './types'

// Service
export {
  listTemplates,
  getTemplate,
  getDefaultTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from './service'

// Hooks
export { useTemplates } from './hooks/useTemplates'
export type { UseTemplatesReturn } from './hooks/useTemplates'
