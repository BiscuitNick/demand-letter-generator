import type { Doc as YDoc } from 'yjs'

export interface CollaboratorInfo {
  id: string
  name: string
  email?: string
  color: string
  cursor?: number
  lastSeen?: Date
}

export interface EditorUser {
  id: string
  name: string
  color: string
}

export interface DocumentMetadata {
  id: string
  title: string
  status: 'draft' | 'review' | 'final'
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface SaveStatus {
  status: 'saving' | 'saved' | 'error'
  message?: string
  lastSaved?: Date
}
