'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Loader2 } from 'lucide-react'

/**
 * Create new document page
 * Creates a new document in Firestore and redirects to the workflow page
 */
export default function NewDocumentPage() {
  return (
    <ProtectedRoute>
      <NewDocumentContent />
    </ProtectedRoute>
  )
}

function NewDocumentContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createDocument = async () => {
      if (!user) return

      try {
        // Create a new document in Firestore
        const docRef = await addDoc(collection(db, 'documents'), {
          title: 'Untitled Demand Letter',
          ownerId: user.uid,
          collaborators: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'draft',
          content: null,
          facts: null,
          outline: null,
        })

        // Redirect to the workflow page
        router.push(`/documents/${docRef.id}`)
      } catch (err) {
        console.error('Error creating document:', err)
        setError('Failed to create document. Please try again.')
        // Redirect back to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    }

    createDocument()
  }, [user, router])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Creating your demand letter...</p>
      </div>
    </div>
  )
}
