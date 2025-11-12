'use client'

import { useState } from 'react'
import { Download, FileText, FileType, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase-client'

interface ExportMenuProps {
  docId: string
  disabled?: boolean
}

type ExportFormat = 'docx' | 'pdf' | 'txt'

export function ExportMenu({ docId, disabled = false }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)

    try {
      // Get Firebase ID token
      const user = auth.currentUser
      if (!user) {
        throw new Error('Not authenticated')
      }

      const token = await user.getIdToken()

      const response = await fetch(`/api/export?docId=${docId}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `document.${format}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export successful',
        description: `Document exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('[ExportMenu] Export error:', error)
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export document',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('docx')}
          disabled={isExporting}
        >
          <FileType className="h-4 w-4 mr-2" />
          Word Document (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('txt')}
          disabled={isExporting}
        >
          <File className="h-4 w-4 mr-2" />
          Plain Text (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
