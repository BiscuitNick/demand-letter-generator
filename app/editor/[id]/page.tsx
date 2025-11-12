'use client'

import { use } from 'react'
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
  const { id } = use(params)

  // For demo purposes, use a mock user
  // In production, get this from your auth system
  const mockUser = {
    id: 'user-1',
    name: 'Demo User',
    color: '#4F46E5', // Indigo color
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
          user={mockUser}
          onSave={(content) => {
            console.log('Document saved:', content)
          }}
          onError={(error) => {
            console.error('Editor error:', error)
          }}
          checkPermissions={async () => {
            // Implement permission checking logic
            // For now, return true (allow all edits)
            return true
          }}
        />
      </div>
    </div>
  )
}
