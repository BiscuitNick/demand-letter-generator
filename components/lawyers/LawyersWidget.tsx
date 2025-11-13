'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Edit, Plus } from 'lucide-react'
import { LawyerFormModal } from './LawyerFormModal'
import { useLawyers } from '@/lib/lawyers/hooks/useLawyers'
import { db } from '@/lib/firebase-client'
import type { Lawyer } from '@/lib/lawyers/types'

export function LawyersWidget() {
  const { lawyers, loading, addLawyer, updateLawyer, deleteLawyer } = useLawyers(db)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null)

  const handleAdd = () => {
    setEditingLawyer(null)
    setModalOpen(true)
  }

  const handleEdit = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer)
    setModalOpen(true)
  }

  const handleSave = async (
    data: Omit<Lawyer, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingLawyer?.id) {
      await updateLawyer(editingLawyer.id, data)
    } else {
      await addLawyer(data)
    }
  }

  const handleDelete = async () => {
    if (editingLawyer?.id) {
      await deleteLawyer(editingLawyer.id)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Lawyers
              </CardTitle>
              <CardDescription>
                Manage your lawyer contacts for quick placeholder population
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading lawyers...</p>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No lawyers added yet</p>
              <Button onClick={handleAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lawyer
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="max-h-[300px] w-full max-w-[680px] overflow-y-auto space-y-2 pr-2">
                {lawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lawyer.name}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                        {lawyer.title && <span>{lawyer.title}</span>}
                        {lawyer.lawfirm && (
                          <>
                            {lawyer.title && <span>•</span>}
                            <span>{lawyer.lawfirm}</span>
                          </>
                        )}
                      </div>
                      {lawyer.email && (
                        <p className="text-xs text-muted-foreground mt-1">{lawyer.email}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lawyer)}
                      className="ml-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={handleAdd} className="w-full max-w-[680px]" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Lawyer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <LawyerFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingLawyer(null)
        }}
        onSave={handleSave}
        onDelete={editingLawyer ? handleDelete : undefined}
        lawyer={editingLawyer}
      />
    </>
  )
}
