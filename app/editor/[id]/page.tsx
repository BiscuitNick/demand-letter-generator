'use client'

import { use } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { EditorWithComments } from '@/components/editor/EditorWithComments'
import { db } from '@/lib/firebase-client'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Document editing page with collaborative editor and comments.
 * Implements Google Docs-style real-time collaboration with inline commenting.
 */
export default function EditorPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <EditorPageContent params={params} />
    </ProtectedRoute>
  )
}

function EditorPageContent({ params }: PageProps) {
  const { id } = use(params)
  const { user } = useAuth()

  // Use authenticated user data
  const userData = user
    ? {
        id: user.uid,
        name: user.displayName || user.email || 'User',
        color: '#4F46E5', // Indigo color - could be dynamic per user
      }
    : {
        id: 'anonymous',
        name: 'Anonymous',
        color: '#6B7280',
      }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4 bg-background">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Collaborative Editor</h1>
          <p className="text-sm text-muted-foreground">
            Edit in real-time with others and add comments
          </p>
        </div>
      </div>

      <div className="flex-1 container mx-auto py-4">
        <EditorWithComments
          docId={id}
          db={db}
          user={userData}
          onSave={(content) => {
            console.log('Document saved:', content)
          }}
          onError={(error) => {
            console.error('Editor error:', error)
          }}
          checkPermissions={async () => {
            // Check if user is authenticated and is owner or collaborator
            return !!user
          }}
        />
      </div>
    </div>
  )
}
