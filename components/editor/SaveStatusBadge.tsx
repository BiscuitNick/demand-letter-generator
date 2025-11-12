'use client'

import { Check, Loader2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SaveStatus } from '@/lib/editor/types'

interface SaveStatusBadgeProps {
  status: SaveStatus
}

/**
 * Displays the current save status with appropriate icon and color.
 * Shows detailed information on hover.
 */
export function SaveStatusBadge({ status }: SaveStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: 'Saving...',
          variant: 'secondary' as const,
          tooltipContent: 'Your changes are being saved',
        }
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          label: 'Saved',
          variant: 'outline' as const,
          tooltipContent: status.lastSaved
            ? `Last saved ${formatTime(status.lastSaved)}`
            : 'All changes saved',
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Error',
          variant: 'destructive' as const,
          tooltipContent: status.message || 'Failed to save changes. Will retry automatically.',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={config.variant}
          className="gap-1 cursor-help"
        >
          {config.icon}
          <span className="text-xs">{config.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">{config.tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Format timestamp as relative time
 */
function formatTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}
