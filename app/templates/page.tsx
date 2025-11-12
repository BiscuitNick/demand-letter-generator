'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Plus, Edit, Trash2, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { TemplateForm, type TemplateFormData } from '@/components/templates/TemplateForm'
import { useTemplates } from '@/lib/templates/hooks/useTemplates'
import { db } from '@/lib/firebase-client'
import { TONE_PRESET_LABELS, type Template } from '@/lib/templates/types'
import { Loader2, MoreVertical } from 'lucide-react'

/**
 * Templates management page
 */
export default function TemplatesPage() {
  return (
    <ProtectedRoute>
      <TemplatesPageContent />
    </ProtectedRoute>
  )
}

function TemplatesPageContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const { toast } = useToast()

  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
  } = useTemplates(db)

  // Mock user ID - in production, get from auth
  const currentUserId = 'user-1'

  const handleCreateTemplate = async (data: TemplateFormData) => {
    try {
      await createTemplate({
        ...data,
        createdBy: currentUserId,
      })

      toast({
        title: 'Template created',
        description: 'Your template has been created successfully.',
      })

      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTemplate = async (data: TemplateFormData) => {
    if (!editingTemplate) return

    try {
      await updateTemplate(editingTemplate.id, data)

      toast({
        title: 'Template updated',
        description: 'Your template has been updated successfully.',
      })

      setEditingTemplate(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteTemplate(templateId)

      toast({
        title: 'Template deleted',
        description: 'The template has been deleted successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefaultTemplate(templateId)

      toast({
        title: 'Default template set',
        description: 'This template is now the default.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set default template. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-destructive">
          <p>Error loading templates: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Manage tone presets and templates for your demand letters
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Table */}
      {templates.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No templates yet</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tone</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TONE_PRESET_LABELS[template.tonePreset]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground truncate">
                      {template.description || 'No description'}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(template.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!template.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(template.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a new template with custom tone and style instructions.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            onSubmit={handleCreateTemplate}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the template settings and tone instructions.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
              onSubmit={handleUpdateTemplate}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
