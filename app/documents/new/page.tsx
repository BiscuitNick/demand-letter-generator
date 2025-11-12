'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useTemplates } from '@/lib/templates/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText } from 'lucide-react'
import { TONE_PRESET_LABELS, TONE_PRESET_DESCRIPTIONS } from '@/lib/templates/types'

/**
 * Create new document page with template selection
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
  const { templates, loading: templatesLoading } = useTemplates(db)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateDocument = async () => {
    if (!user) return

    setCreating(true)
    setError(null)

    try {
      // Create a new document in Firestore
      const docData: any = {
        title: 'Untitled Demand Letter',
        ownerId: user.uid,
        collaborators: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft',
        content: null,
        facts: null,
        outline: null,
      }

      // Add templateId if a template was selected (null means system default)
      if (selectedTemplate !== 'system') {
        docData.templateId = selectedTemplate
      }

      const docRef = await addDoc(collection(db, 'documents'), docData)

      // Redirect to the workflow page
      router.push(`/documents/${docRef.id}`)
    } catch (err) {
      console.error('Error creating document:', err)
      setError('Failed to create document. Please try again.')
      setCreating(false)
    }
  }

  if (templatesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Demand Letter</h1>
        <p className="text-muted-foreground">
          Select a template to define the tone and style of your document
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose Template</CardTitle>
          <CardDescription>
            Select a template or use the system default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedTemplate || 'system'} onValueChange={setSelectedTemplate}>
            <div className="space-y-3">
              {/* System Default Option */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="system" id="system" className="mt-1" />
                <Label htmlFor="system" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">System Default</span>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use the built-in professional tone with standard legal terminology
                  </p>
                </Label>
              </div>

              {/* User Templates */}
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                  <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {TONE_PRESET_LABELS[template.tonePreset]}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                  </Label>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No custom templates yet. You can create templates from the Templates page.
                  </p>
                </div>
              )}
            </div>
          </RadioGroup>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={creating}
              className="flex-1"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Document'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
