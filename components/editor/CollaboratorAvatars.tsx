'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import type { CollaboratorInfo } from '@/lib/editor/types'

interface CollaboratorAvatarsProps {
  collaborators: CollaboratorInfo[]
  maxDisplay?: number
}

/**
 * Displays active collaborator avatars with presence indicators.
 * Shows user names on hover and handles overflow with a count badge.
 */
export function CollaboratorAvatars({
  collaborators,
  maxDisplay = 5,
}: CollaboratorAvatarsProps) {
  const displayedCollaborators = collaborators.slice(0, maxDisplay)
  const overflowCount = Math.max(0, collaborators.length - maxDisplay)

  if (collaborators.length === 0) {
    return null
  }

  /**
   * Get initials from a name
   */
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  /**
   * Format last seen time
   */
  const formatLastSeen = (date?: Date): string => {
    if (!date) return 'Just now'

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 10) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    return 'Active'
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">
        {collaborators.length === 1 ? '1 person' : `${collaborators.length} people`} editing
      </span>

      <div className="flex items-center -space-x-2">
        {displayedCollaborators.map((collaborator) => (
          <Tooltip key={collaborator.id}>
            <TooltipTrigger asChild>
              <Avatar
                className="h-8 w-8 border-2 border-background cursor-pointer transition-transform hover:scale-110 hover:z-10"
                style={{
                  borderColor: 'white',
                }}
              >
                <AvatarFallback
                  style={{
                    backgroundColor: collaborator.color,
                    color: getContrastColor(collaborator.color),
                  }}
                  className="text-xs font-medium"
                >
                  {getInitials(collaborator.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">{collaborator.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatLastSeen(collaborator.lastSeen)}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {overflowCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"
              >
                +{overflowCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{overflowCount} more {overflowCount === 1 ? 'person' : 'people'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

/**
 * Get contrasting text color (black or white) for a background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
