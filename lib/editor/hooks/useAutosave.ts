'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Doc as YDoc } from 'yjs'
import { encodeStateAsUpdate } from 'yjs'
import type { Firestore } from 'firebase/firestore'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type { SaveStatus } from '../types'

export interface UseAutosaveOptions {
  ydoc: YDoc
  docId: string
  db: Firestore
  enabled?: boolean
  debounceMs?: number
  maxIntervalMs?: number
  onSave?: () => void
  onError?: (error: Error) => void
  checkPermissions?: () => Promise<boolean>
}

/**
 * Hook for autosaving Y.Doc content to Firestore with debouncing.
 * Ensures saves happen at least every 5 seconds and on blur events.
 *
 * @param options - Configuration options
 * @returns Save status and manual save function
 */
export function useAutosave({
  ydoc,
  docId,
  db,
  enabled = true,
  debounceMs = 2000,
  maxIntervalMs = 5000,
  onSave,
  onError,
  checkPermissions,
}: UseAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'saved',
  })

  const docRef = doc(db, 'documents', docId)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const maxIntervalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTimeRef = useRef<number>(Date.now())
  const isSavingRef = useRef(false)
  const saveQueueRef = useRef<Uint8Array | null>(null)

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(
    async (update?: Uint8Array) => {
      if (isSavingRef.current) {
        // Queue the update if a save is in progress
        saveQueueRef.current = update || encodeStateAsUpdate(ydoc)
        return
      }

      isSavingRef.current = true
      setSaveStatus({ status: 'saving' })

      try {
        // Check permissions if provided
        if (checkPermissions) {
          const hasPermission = await checkPermissions()
          if (!hasPermission) {
            throw new Error('Permission denied: You do not have write access to this document')
          }
        }

        // Get the latest state
        const stateVector = update || encodeStateAsUpdate(ydoc)
        const base64Update = btoa(String.fromCharCode(...Array.from(stateVector)))

        // Update Firestore
        await updateDoc(docRef, {
          content: base64Update,
          updatedAt: serverTimestamp(),
        })

        lastSaveTimeRef.current = Date.now()
        setSaveStatus({
          status: 'saved',
          lastSaved: new Date(),
        })

        onSave?.()
        console.log('[useAutosave] Document saved successfully')

        // Process queued save if any
        if (saveQueueRef.current) {
          const queuedUpdate = saveQueueRef.current
          saveQueueRef.current = null
          isSavingRef.current = false
          // Retry with queued update
          setTimeout(() => performSave(queuedUpdate), 100)
        } else {
          isSavingRef.current = false
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error))
        console.error('[useAutosave] Save failed:', errorObj)

        setSaveStatus({
          status: 'error',
          message: errorObj.message,
        })

        onError?.(errorObj)
        isSavingRef.current = false

        // Retry with exponential backoff
        retryWithBackoff()
      }
    },
    [ydoc, docRef, checkPermissions, onSave, onError]
  )

  /**
   * Retry save with exponential backoff
   */
  const retryWithBackoff = useCallback(() => {
    const retryDelay = 1000 // Start with 1 second
    console.log(`[useAutosave] Retrying in ${retryDelay}ms...`)

    setTimeout(() => {
      if (enabled) {
        performSave()
      }
    }, retryDelay)
  }, [enabled, performSave])

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(() => {
    if (!enabled) return

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, debounceMs)
  }, [enabled, debounceMs, performSave])

  /**
   * Manual save function
   */
  const save = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (maxIntervalTimerRef.current) {
      clearTimeout(maxIntervalTimerRef.current)
    }
    performSave()
  }, [performSave])

  // Set up Y.Doc update listener
  useEffect(() => {
    if (!enabled) return

    const handleUpdate = () => {
      debouncedSave()
    }

    ydoc.on('update', handleUpdate)

    return () => {
      ydoc.off('update', handleUpdate)
    }
  }, [ydoc, enabled, debouncedSave])

  // Set up max interval timer (ensure save at least every 5 seconds)
  useEffect(() => {
    if (!enabled) return

    maxIntervalTimerRef.current = setInterval(() => {
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current

      if (timeSinceLastSave >= maxIntervalMs && !isSavingRef.current) {
        console.log('[useAutosave] Max interval reached, forcing save')
        performSave()
      }
    }, maxIntervalMs)

    return () => {
      if (maxIntervalTimerRef.current) {
        clearInterval(maxIntervalTimerRef.current)
      }
    }
  }, [enabled, maxIntervalMs, performSave])

  // Set up blur event listener (save on blur)
  useEffect(() => {
    if (!enabled) return

    const handleBlur = () => {
      console.log('[useAutosave] Window blur detected, saving...')
      save()
    }

    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [enabled, save])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (maxIntervalTimerRef.current) {
        clearInterval(maxIntervalTimerRef.current)
      }

      // Final save on unmount
      if (enabled && !isSavingRef.current) {
        performSave()
      }
    }
  }, [enabled, performSave])

  return {
    saveStatus,
    save,
  }
}
