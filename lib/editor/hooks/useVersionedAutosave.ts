'use client'

import { useCallback, useRef } from 'react'
import type { Doc as YDoc } from 'yjs'
import type { Firestore } from 'firebase/firestore'
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore'
import { useAutosave, type UseAutosaveOptions } from './useAutosave'
import type { SaveStatus } from '../types'

export interface UseVersionedAutosaveOptions extends Omit<UseAutosaveOptions, 'onSave'> {
  userId: string
  userName: string
  onVersionCreated?: (version: number) => void
}

/**
 * Enhanced autosave hook that tracks versions and creates history entries.
 * Wraps the base useAutosave hook with version management.
 */
export function useVersionedAutosave({
  ydoc,
  docId,
  db,
  userId,
  userName,
  enabled = true,
  debounceMs = 2000,
  maxIntervalMs = 5000,
  onError,
  onVersionCreated,
  checkPermissions,
}: UseVersionedAutosaveOptions) {
  const docRef = doc(db, 'documents', docId)
  const lastContentRef = useRef<string>('')
  const versionRef = useRef<number>(1)

  /**
   * Create a history entry in Firestore
   */
  const createHistoryEntry = useCallback(
    async (version: number, diffSummary: string) => {
      try {
        const historyRef = doc(db, 'documents', docId, 'history', `v${version}`)

        await updateDoc(historyRef, {
          version,
          timestamp: serverTimestamp(),
          authorId: userId,
          authorName: userName,
          diffSummary,
          changeType: 'edit',
        }).catch(async () => {
          // If document doesn't exist, create it
          const { setDoc } = await import('firebase/firestore')
          await setDoc(historyRef, {
            version,
            timestamp: serverTimestamp(),
            authorId: userId,
            authorName: userName,
            diffSummary,
            changeType: 'edit',
          })
        })

        console.log('[useVersionedAutosave] Created history entry for version', version)
      } catch (error) {
        console.error('[useVersionedAutosave] Failed to create history entry:', error)
        // Don't throw - history is supplementary
      }
    },
    [db, docId, userId, userName]
  )

  /**
   * Generate diff summary (simple implementation)
   */
  const generateDiffSummary = useCallback((oldContent: string, newContent: string): string => {
    const oldLength = oldContent.length
    const newLength = newContent.length
    const diff = newLength - oldLength

    if (oldLength === 0) {
      return 'Initial content created'
    } else if (diff > 0) {
      return `Added ${diff} characters`
    } else if (diff < 0) {
      return `Removed ${Math.abs(diff)} characters`
    } else {
      return 'Content modified'
    }
  }, [])

  /**
   * Enhanced save callback that increments version and creates history
   */
  const handleSave = useCallback(async () => {
    try {
      // Get current content from Y.Doc
      const currentContent = ydoc.getText('content').toString()

      // Check if content has meaningfully changed
      if (currentContent === lastContentRef.current) {
        console.log('[useVersionedAutosave] No content changes, skipping version increment')
        return
      }

      // Generate diff summary
      const diffSummary = generateDiffSummary(lastContentRef.current, currentContent)

      // Increment version in Firestore
      await updateDoc(docRef, {
        version: increment(1),
      })

      // Increment local version counter
      versionRef.current += 1
      const newVersion = versionRef.current

      // Create history entry
      await createHistoryEntry(newVersion, diffSummary)

      // Update last content reference
      lastContentRef.current = currentContent

      // Notify callback
      onVersionCreated?.(newVersion)

      console.log('[useVersionedAutosave] Version incremented to', newVersion)
    } catch (error) {
      console.error('[useVersionedAutosave] Failed to increment version:', error)
      // Don't propagate error - autosave will handle it
    }
  }, [ydoc, docRef, createHistoryEntry, generateDiffSummary, onVersionCreated])

  /**
   * Initialize version from Firestore
   */
  const initializeVersion = useCallback(async () => {
    try {
      const { getDoc } = await import('firebase/firestore')
      const snapshot = await getDoc(docRef)

      if (snapshot.exists()) {
        const data = snapshot.data()
        versionRef.current = data.version || 1

        // Initialize last content if available
        if (data.content) {
          lastContentRef.current = ydoc.getText('content').toString()
        }
      }
    } catch (error) {
      console.error('[useVersionedAutosave] Failed to initialize version:', error)
    }
  }, [docRef, ydoc])

  // Initialize version on mount
  useCallback(() => {
    initializeVersion()
  }, [initializeVersion])()

  // Use base autosave hook with enhanced save callback
  const autosaveResult = useAutosave({
    ydoc,
    docId,
    db,
    enabled,
    debounceMs,
    maxIntervalMs,
    onSave: handleSave,
    onError,
    checkPermissions,
  })

  return {
    ...autosaveResult,
    currentVersion: versionRef.current,
  }
}
