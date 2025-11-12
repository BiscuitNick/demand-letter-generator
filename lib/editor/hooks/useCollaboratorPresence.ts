'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import type { CollaboratorInfo, EditorUser } from '../types'

export interface UseCollaboratorPresenceOptions {
  db: Firestore
  docId: string
  user: EditorUser
  awareness?: any // Y.js Awareness instance
}

/**
 * Hook to manage collaborator presence in Firestore.
 * Tracks active users, updates presence on focus/blur, and cleans up on unmount.
 *
 * @param options - Configuration options
 * @returns Active collaborators and presence update functions
 */
export function useCollaboratorPresence({
  db,
  docId,
  user,
  awareness,
}: UseCollaboratorPresenceOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([])
  const [isActive, setIsActive] = useState(false)

  // Collection reference for collaborators
  const collaboratorsRef = collection(db, 'documents', docId, 'collaborators')
  const userPresenceRef = doc(collaboratorsRef, user.id)

  /**
   * Update user presence in Firestore
   */
  const updatePresence = useCallback(
    async (active: boolean) => {
      try {
        if (active) {
          await setDoc(
            userPresenceRef,
            {
              id: user.id,
              name: user.name,
              color: user.color,
              lastSeen: serverTimestamp(),
              cursor: awareness?.getLocalState()?.cursor || 0,
            },
            { merge: true }
          )
          console.log('[useCollaboratorPresence] Presence updated: active')
        } else {
          // Remove presence when inactive
          await deleteDoc(userPresenceRef)
          console.log('[useCollaboratorPresence] Presence removed')
        }
        setIsActive(active)
      } catch (error) {
        console.error('[useCollaboratorPresence] Error updating presence:', error)
      }
    },
    [user, userPresenceRef, awareness]
  )

  /**
   * Handle focus event
   */
  const handleFocus = useCallback(() => {
    updatePresence(true)
  }, [updatePresence])

  /**
   * Handle blur event
   */
  const handleBlur = useCallback(() => {
    updatePresence(false)
  }, [updatePresence])

  /**
   * Handle beforeunload event
   */
  const handleBeforeUnload = useCallback(() => {
    // Use sendBeacon for reliable cleanup on page unload
    const payload = JSON.stringify({ docId, userId: user.id })
    navigator.sendBeacon('/api/presence/cleanup', payload)
  }, [docId, user.id])

  // Set up presence tracking
  useEffect(() => {
    // Set initial presence
    updatePresence(true)

    // Listen for focus/blur events
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Update presence periodically (heartbeat)
    const heartbeatInterval = setInterval(() => {
      if (document.hasFocus()) {
        updatePresence(true)
      }
    }, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(heartbeatInterval)

      // Clean up presence on unmount
      updatePresence(false)
    }
  }, [updatePresence, handleFocus, handleBlur, handleBeforeUnload])

  // Subscribe to collaborator changes
  useEffect(() => {
    // Query for active collaborators (those updated in last 60 seconds)
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)

    const unsubscribe = onSnapshot(
      collaboratorsRef,
      (snapshot) => {
        const activeCollaborators: CollaboratorInfo[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          // Only include if it's not the current user and has recent activity
          if (doc.id !== user.id && data.lastSeen) {
            activeCollaborators.push({
              id: doc.id,
              name: data.name || 'Anonymous',
              color: data.color || '#808080',
              cursor: data.cursor,
              lastSeen: data.lastSeen?.toDate(),
            })
          }
        })

        setCollaborators(activeCollaborators)
        console.log('[useCollaboratorPresence] Active collaborators:', activeCollaborators.length)
      },
      (error) => {
        console.error('[useCollaboratorPresence] Error listening to collaborators:', error)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [db, docId, user.id, collaboratorsRef])

  return {
    collaborators,
    isActive,
    updatePresence,
  }
}
