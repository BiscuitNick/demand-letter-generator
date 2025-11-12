'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Firestore } from 'firebase/firestore'
import type { Template, CreateTemplateOptions, UpdateTemplateOptions } from '../types'
import {
  listTemplates,
  getTemplate,
  createTemplate as createTemplateService,
  updateTemplate as updateTemplateService,
  deleteTemplate as deleteTemplateService,
  setDefaultTemplate as setDefaultTemplateService,
} from '../service'

export interface UseTemplatesReturn {
  templates: Template[]
  loading: boolean
  error: Error | null
  createTemplate: (options: CreateTemplateOptions) => Promise<string>
  updateTemplate: (templateId: string, options: UpdateTemplateOptions) => Promise<void>
  deleteTemplate: (templateId: string) => Promise<void>
  setDefaultTemplate: (templateId: string) => Promise<void>
  refreshTemplates: () => Promise<void>
}

/**
 * Hook for managing templates.
 * Provides CRUD operations and state management.
 *
 * @param db - Firestore instance
 * @returns Template data and operations
 */
export function useTemplates(db: Firestore): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loadedTemplates = await listTemplates(db)
      setTemplates(loadedTemplates)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.error('[useTemplates] Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }, [db])

  // Initial load
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // Create template
  const createTemplate = useCallback(
    async (options: CreateTemplateOptions): Promise<string> => {
      try {
        const templateId = await createTemplateService(db, options)
        await loadTemplates() // Refresh list
        return templateId
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db, loadTemplates]
  )

  // Update template
  const updateTemplate = useCallback(
    async (templateId: string, options: UpdateTemplateOptions): Promise<void> => {
      try {
        await updateTemplateService(db, templateId, options)
        await loadTemplates() // Refresh list
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db, loadTemplates]
  )

  // Delete template
  const deleteTemplate = useCallback(
    async (templateId: string): Promise<void> => {
      try {
        await deleteTemplateService(db, templateId)
        await loadTemplates() // Refresh list
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db, loadTemplates]
  )

  // Set default template
  const setDefaultTemplate = useCallback(
    async (templateId: string): Promise<void> => {
      try {
        await setDefaultTemplateService(db, templateId)
        await loadTemplates() // Refresh list
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      }
    },
    [db, loadTemplates]
  )

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    refreshTemplates: loadTemplates,
  }
}
