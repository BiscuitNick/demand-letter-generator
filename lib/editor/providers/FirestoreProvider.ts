'use client'

import { Doc as YDoc, applyUpdate, encodeStateAsUpdate } from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import type {
  DocumentReference,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore'
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

export interface FirestoreProviderConfig {
  db: Firestore
  docId: string
  awareness?: Awareness
}

/**
 * Custom Firestore provider for Y.js document synchronization.
 * Syncs Y.Doc updates with Firestore and manages awareness state for collaborators.
 *
 * Note: This is a simplified implementation. For production, consider using
 * a more robust solution with operational transformation conflict resolution.
 */
export class FirestoreProvider {
  private ydoc: YDoc
  private db: Firestore
  private docId: string
  private docRef: DocumentReference
  private awareness: Awareness | null
  private unsubscribe: Unsubscribe | null = null
  private isDestroyed = false
  private isSynced = false
  private updateHandler: ((update: Uint8Array, origin: any) => void) | null =
    null

  constructor(ydoc: YDoc, config: FirestoreProviderConfig) {
    this.ydoc = ydoc
    this.db = config.db
    this.docId = config.docId
    this.docRef = doc(this.db, 'documents', this.docId)
    this.awareness = config.awareness || null

    this.connect()
  }

  /**
   * Connect to Firestore and set up bidirectional sync
   */
  private async connect() {
    if (this.isDestroyed) return

    console.log(`[FirestoreProvider] Connecting to docId: ${this.docId}`)

    // Listen for Y.Doc updates and push to Firestore
    this.updateHandler = async (update: Uint8Array, origin: any) => {
      // Don't sync updates that came from Firestore
      if (origin === 'firestore-update') return
      if (this.isDestroyed) return

      try {
        // Encode the current state as an update
        const stateVector = encodeStateAsUpdate(this.ydoc)
        const base64Update = btoa(
          String.fromCharCode(...Array.from(stateVector))
        )

        // Update Firestore with the new state
        await updateDoc(this.docRef, {
          content: base64Update,
          updatedAt: serverTimestamp(),
        })

        console.log(`[FirestoreProvider] Pushed update to Firestore`)
      } catch (error) {
        console.error('[FirestoreProvider] Error pushing update:', error)
        // TODO: Implement retry with exponential backoff
      }
    }

    this.ydoc.on('update', this.updateHandler)

    // Listen for Firestore changes and apply to Y.Doc
    this.unsubscribe = onSnapshot(
      this.docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log(`[FirestoreProvider] Document does not exist, creating...`)
          this.initializeDocument()
          return
        }

        const data = snapshot.data()
        if (data?.content) {
          try {
            // Decode base64 content
            const binaryString = atob(data.content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }

            // Apply update to Y.Doc with 'firestore-update' origin to prevent loop
            applyUpdate(this.ydoc, bytes, 'firestore-update')

            if (!this.isSynced) {
              this.isSynced = true
              console.log(`[FirestoreProvider] Initial sync complete`)
            }
          } catch (error) {
            console.error('[FirestoreProvider] Error applying update:', error)
          }
        }
      },
      (error) => {
        console.error('[FirestoreProvider] Firestore listener error:', error)
        if (error.code === 'permission-denied') {
          console.error('[FirestoreProvider] Permission denied - check Firestore security rules')
        }
        // TODO: Implement reconnection logic with backoff
      }
    )
  }

  /**
   * Initialize a new Firestore document if it doesn't exist
   */
  private async initializeDocument() {
    try {
      const stateVector = encodeStateAsUpdate(this.ydoc)
      const base64Update = btoa(String.fromCharCode(...Array.from(stateVector)))

      await setDoc(
        this.docRef,
        {
          content: base64Update,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      console.log(`[FirestoreProvider] Document initialized`)
    } catch (error) {
      console.error('[FirestoreProvider] Error initializing document:', error)
    }
  }

  /**
   * Disconnect and clean up resources
   */
  public destroy() {
    if (this.isDestroyed) return

    console.log(`[FirestoreProvider] Destroying provider for docId: ${this.docId}`)

    this.isDestroyed = true

    if (this.updateHandler) {
      this.ydoc.off('update', this.updateHandler)
      this.updateHandler = null
    }

    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    this.awareness?.destroy()
  }

  /**
   * Check if provider is synced with Firestore
   */
  public get synced(): boolean {
    return this.isSynced
  }
}
