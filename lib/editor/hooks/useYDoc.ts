'use client'

import { useMemo, useEffect, useRef } from 'react'
import { Doc as YDoc } from 'yjs'

/**
 * Hook that manages Y.Doc lifecycle per document ID.
 * Memoizes Y.Doc instance to ensure single instance per docId and
 * cleans up listeners on unmount to prevent memory leaks.
 *
 * @param docId - The unique document identifier
 * @returns Memoized Y.Doc instance
 *
 * @example
 * ```tsx
 * const ydoc = useYDoc(documentId)
 * // Use ydoc with your editor
 * ```
 */
export function useYDoc(docId: string): YDoc {
  // Memoize Y.Doc instance based on docId to ensure singleton behavior
  const ydoc = useMemo(() => {
    const doc = new YDoc()
    console.log(`[useYDoc] Created new Y.Doc for docId: ${docId}`)
    return doc
  }, [docId])

  // Track if component is mounted
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    // Handle beforeunload to ensure clean shutdown
    const handleBeforeUnload = () => {
      console.log(`[useYDoc] beforeunload - cleaning up docId: ${docId}`)
      // Provider cleanup should be handled by the provider hook
    }

    // Handle visibility change for connection management
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(`[useYDoc] Page hidden - docId: ${docId}`)
      } else {
        console.log(`[useYDoc] Page visible - docId: ${docId}`)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMountedRef.current = false
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Destroy Y.Doc instance on cleanup
      // Note: We defer destruction to allow graceful provider cleanup
      setTimeout(() => {
        if (!isMountedRef.current) {
          console.log(`[useYDoc] Destroying Y.Doc for docId: ${docId}`)
          ydoc.destroy()
        }
      }, 1000)
    }
  }, [docId, ydoc])

  return ydoc
}
