// Hooks
export { useYDoc } from './hooks/useYDoc'
export { useFirestoreProvider } from './hooks/useFirestoreProvider'
export { useCollaborativeEditor } from './hooks/useCollaborativeEditor'
export { useAutosave } from './hooks/useAutosave'
export { useCollaboratorPresence } from './hooks/useCollaboratorPresence'

// Providers
export { FirestoreProvider } from './providers/FirestoreProvider'

// Config
export { getBaseExtensions, getCollaborativeExtensions, editorConfig } from './config'

// Types
export type {
  CollaboratorInfo,
  EditorUser,
  DocumentMetadata,
  SaveStatus,
} from './types'
