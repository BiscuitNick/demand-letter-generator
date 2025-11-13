'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import type { Lawyer } from '@/lib/lawyers/types'
import { toast } from 'sonner'

interface LawyerFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Lawyer, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onDelete?: () => Promise<void>
  lawyer?: Lawyer | null
}

export function LawyerFormModal({
  open,
  onClose,
  onSave,
  onDelete,
  lawyer,
}: LawyerFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    lawfirm: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    zip: '',
    email: '',
    phone_number: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open && lawyer) {
      setFormData({
        name: lawyer.name || '',
        title: lawyer.title || '',
        lawfirm: lawyer.lawfirm || '',
        address_1: lawyer.address_1 || '',
        address_2: lawyer.address_2 || '',
        city: lawyer.city || '',
        state: lawyer.state || '',
        zip: lawyer.zip || '',
        email: lawyer.email || '',
        phone_number: lawyer.phone_number || '',
      })
    } else if (open && !lawyer) {
      setFormData({
        name: '',
        title: '',
        lawfirm: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        zip: '',
        email: '',
        phone_number: '',
      })
    }
  }, [open, lawyer])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      toast.success(lawyer ? 'Lawyer updated' : 'Lawyer added')
      onClose()
    } catch (error) {
      console.error('Error saving lawyer:', error)
      toast.error('Failed to save lawyer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (!confirm('Are you sure you want to delete this lawyer?')) {
      return
    }

    setDeleting(true)
    try {
      await onDelete()
      toast.success('Lawyer deleted')
      onClose()
    } catch (error) {
      console.error('Error deleting lawyer:', error)
      toast.error('Failed to delete lawyer')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lawyer ? 'Edit Lawyer' : 'Add Lawyer'}</DialogTitle>
          <DialogDescription>
            {lawyer
              ? 'Update lawyer information below.'
              : 'Add a new lawyer to your contact list.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Attorney"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lawfirm">Law Firm</Label>
            <Input
              id="lawfirm"
              value={formData.lawfirm}
              onChange={(e) => setFormData({ ...formData, lawfirm: e.target.value })}
              placeholder="Smith & Associates"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_1">Address Line 1</Label>
            <Input
              id="address_1"
              value={formData.address_1}
              onChange={(e) => setFormData({ ...formData, address_1: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_2">Address Line 2</Label>
            <Input
              id="address_2"
              value={formData.address_2}
              onChange={(e) => setFormData({ ...formData, address_2: e.target.value })}
              placeholder="Suite 100"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Los Angeles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              placeholder="90210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@lawfirm.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {lawyer && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
