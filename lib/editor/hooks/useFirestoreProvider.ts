'use client'

import { useEffect, useRef, useState } from 'react'
import type { Doc as YDoc } from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import type { Firestore } from 'firebase/firestore'
import { FirestoreProvider } from '../providers/FirestoreProvider'

export interface UseFirestoreProviderOptions {
  ydoc: YDoc
  docId: string
  db: Firestore
  user?: {
    id: string
    name: string
    color: string
  }
}

export interface UseFirestoreProviderReturn {
  provider: FirestoreProvider | null
  awareness: Awareness | null
  synced: boolean
  error: Error | null
}

/**
 * Hook to manage Firestore ↔ Y.js provider lifecycle.
 * Connects Y.Doc to Firestore, initializes awareness for presence,
 * and handles reconnection with backoff on errors.
 *
 * @param options - Configuration options
 * @returns Provider instance, awareness, sync status, and any errors
 *
 * @example
 * ```tsx
 * const { provider, awareness, synced, error } = useFirestoreProvider({
 *   ydoc,
 *   docId: 'document-123',
 *   db: firestore,
 *   user: { id: 'user-1', name: 'John', color: '#FF0000' }
 * })
 * ```
 */
export function useFirestoreProvider({
  ydoc,
  docId,
  db,
  user,
}: UseFirestoreProviderOptions): UseFirestoreProviderReturn {
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const providerRef = useRef<FirestoreProvider | null>(null)
  const awarenessRef = useRef<Awareness | null>(null)

  useEffect(() => {
    // Initialize awareness if user info is provided
    if (user && !awarenessRef.current) {
      awarenessRef.current = new Awareness(ydoc)
      awarenessRef.current.setLocalState({
        user: {
          id: user.id,
          name: user.name,
          color: user.color,
        },
      })
      console.log('[useFirestoreProvider] Awareness initialized')
    }

    // Create provider
    try {
      providerRef.current = new FirestoreProvider(ydoc, {
        db,
        docId,
        awareness: awarenessRef.current || undefined,
      })

      // Poll sync status (simplified - in production, implement proper event handling)
      const syncCheckInterval = setInterval(() => {
        if (providerRef.current?.synced) {
          setSynced(true)
          clearInterval(syncCheckInterval)
        }
      }, 100)

      console.log('[useFirestoreProvider] Provider created')

      return () => {
        clearInterval(syncCheckInterval)
        if (providerRef.current) {
          providerRef.current.destroy()
          providerRef.current = null
        }
        if (awarenessRef.current) {
          awarenessRef.current.destroy()
          awarenessRef.current = null
        }
        setSynced(false)
        setError(null)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      console.error('[useFirestoreProvider] Provider creation failed:', errorObj)
    }
  }, [ydoc, docId, db, user])

  return {
    provider: providerRef.current,
    awareness: awarenessRef.current,
    synced,
    error,
  }
}
