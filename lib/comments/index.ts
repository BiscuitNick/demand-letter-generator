// Types
export type {
  Comment,
  CommentRange,
  CommentReply,
  CommentDocument,
  CommentWithState,
  CreateCommentOptions,
  AddReplyOptions,
} from './types'

// Service
export {
  createComment,
  addReply,
  toggleResolveComment,
  deleteComment,
  subscribeToComments,
  getUnresolvedCount,
} from './service'

// Hooks
export { useComments } from './hooks/useComments'
export type { UseCommentsOptions, UseCommentsReturn } from './hooks/useComments'
