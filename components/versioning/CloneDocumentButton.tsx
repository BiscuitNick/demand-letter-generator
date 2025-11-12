'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface CloneDocumentButtonProps {
  docId: string
  currentTitle: string
  userId: string
  userName: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  redirectOnClone?: boolean
}

export function CloneDocumentButton({
  docId,
  currentTitle,
  userId,
  userName,
  variant = 'outline',
  size = 'sm',
  redirectOnClone = true,
}: CloneDocumentButtonProps) {
  const [open, setOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(`${currentTitle} (Copy)`)
  const [includeComments, setIncludeComments] = useState(false)
  const [includeHistory, setIncludeHistory] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleClone = async () => {
    setIsCloning(true)

    try {
      const response = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          newTitle,
          userId,
          userName,
          includeComments,
          includeHistory,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clone document')
      }

      const result = await response.json()

      toast({
        title: 'Document cloned',
        description: `Successfully created "${newTitle}"`,
      })

      setOpen(false)

      // Redirect to the new document if requested
      if (redirectOnClone) {
        router.push(`/editor/${result.newDocId}`)
      } else {
        // Refresh the current page to show the new document
        router.refresh()
      }
    } catch (error) {
      console.error('Clone error:', error)
      toast({
        title: 'Clone failed',
        description: error instanceof Error ? error.message : 'Failed to clone document',
        variant: 'destructive',
      })
    } finally {
      setIsCloning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isCloning}>
          {isCloning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Clone
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Document</DialogTitle>
          <DialogDescription>
            Create a copy of this document with a new title
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">New Title</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="comments"
              checked={includeComments}
              onCheckedChange={(checked) => setIncludeComments(checked === true)}
            />
            <Label
              htmlFor="comments"
              className="text-sm font-normal cursor-pointer"
            >
              Include comments
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="history"
              checked={includeHistory}
              onCheckedChange={(checked) => setIncludeHistory(checked === true)}
            />
            <Label
              htmlFor="history"
              className="text-sm font-normal cursor-pointer"
            >
              Include version history
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCloning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            disabled={isCloning || !newTitle.trim()}
          >
            {isCloning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cloning...
              </>
            ) : (
              'Clone Document'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
