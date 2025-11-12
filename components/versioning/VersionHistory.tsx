'use client'

import { useEffect, useState } from 'react'
import type { Firestore } from 'firebase/firestore'
import { getDocumentHistory } from '@/lib/versioning/service'
import type { HistoryEntry } from '@/lib/versioning/types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, User, GitBranch, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface VersionHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  docId: string
  db: Firestore
  currentVersion?: number
}

/**
 * Version history sidebar component
 */
export function VersionHistory({
  open,
  onOpenChange,
  docId,
  db,
  currentVersion,
}: VersionHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const loadHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        const entries = await getDocumentHistory(db, docId, 50)
        setHistory(entries)
      } catch (err) {
        console.error('Failed to load history:', err)
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [open, docId, db])

  const getChangeTypeBadge = (changeType: HistoryEntry['changeType']) => {
    const variants: Record<typeof changeType, { label: string; variant: any }> = {
      create: { label: 'Created', variant: 'default' },
      edit: { label: 'Edited', variant: 'secondary' },
      clone: { label: 'Cloned', variant: 'outline' },
      refine: { label: 'Refined', variant: 'default' },
      export: { label: 'Exported', variant: 'secondary' },
    }

    const config = variants[changeType]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </SheetTitle>
          <SheetDescription>
            {currentVersion && `Current version: ${currentVersion}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No version history available
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-4 pr-4">
                {history.map((entry, index) => (
                  <div key={entry.id}>
                    <div className="flex flex-col gap-2">
                      {/* Version header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Version {entry.version}
                          </span>
                          {getChangeTypeBadge(entry.changeType)}
                          {currentVersion === entry.version && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                        </span>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{entry.authorName}</span>
                      </div>

                      {/* Diff summary */}
                      <div className="text-sm mt-1">
                        {entry.diffSummary}
                      </div>
                    </div>

                    {index < history.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
