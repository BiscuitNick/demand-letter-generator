import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Comment } from '@/lib/comments/types'

export interface CommentExtensionOptions {
  comments: Comment[]
  onCommentClick?: (commentId: string) => void
  activeCommentId?: string | null
}

export const CommentExtensionKey = new PluginKey('comments')

/**
 * Tiptap extension for rendering comment decorations
 */
export const CommentExtension = Extension.create<CommentExtensionOptions>({
  name: 'comments',

  addOptions() {
    return {
      comments: [],
      onCommentClick: undefined,
      activeCommentId: null,
    }
  },

  addProseMirrorPlugins() {
    const { comments, onCommentClick, activeCommentId } = this.options

    return [
      new Plugin({
        key: CommentExtensionKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldState) {
            // Update decorations when comments change
            const meta = tr.getMeta(CommentExtensionKey)
            if (meta) {
              return meta.decorationSet
            }
            return oldState.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            const decorations: Decoration[] = []

            comments.forEach((comment) => {
              const { from, to } = comment.range
              const isActive = comment.id === activeCommentId

              // Skip if range is invalid
              if (from < 0 || to > state.doc.content.size || from >= to) {
                return
              }

              // Add highlight decoration for the commented text
              const highlightClass = comment.resolved
                ? 'comment-resolved'
                : isActive
                ? 'comment-active'
                : 'comment-highlight'

              decorations.push(
                Decoration.inline(from, to, {
                  class: `${highlightClass} cursor-pointer`,
                  'data-comment-id': comment.id,
                })
              )

              // Add badge widget at the end of the selection
              const badgeWidget = document.createElement('span')
              badgeWidget.className = `comment-badge ${
                comment.resolved ? 'resolved' : ''
              } ${isActive ? 'active' : ''}`
              badgeWidget.innerHTML = `
                <span class="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                  comment.resolved
                    ? 'bg-gray-300 text-gray-600'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-yellow-400 text-yellow-900'
                } ml-1 cursor-pointer hover:scale-110 transition-transform">
                  💬
                </span>
              `
              badgeWidget.setAttribute('data-comment-id', comment.id)
              badgeWidget.onclick = (e) => {
                e.stopPropagation()
                onCommentClick?.(comment.id)
              }

              decorations.push(Decoration.widget(to, badgeWidget))
            })

            return DecorationSet.create(state.doc, decorations)
          },
          handleDOMEvents: {
            click(view, event) {
              const target = event.target as HTMLElement
              const commentId =
                target.getAttribute('data-comment-id') ||
                target.closest('[data-comment-id]')?.getAttribute('data-comment-id')

              if (commentId && onCommentClick) {
                onCommentClick(commentId)
                return true
              }

              return false
            },
          },
        },
      }),
    ]
  },
})

/**
 * Update comment decorations in the editor
 */
export function updateCommentDecorations(
  editor: any,
  comments: Comment[],
  activeCommentId?: string | null
) {
  const { state } = editor
  const decorations: Decoration[] = []

  comments.forEach((comment) => {
    const { from, to } = comment.range
    const isActive = comment.id === activeCommentId

    if (from >= 0 && to <= state.doc.content.size && from < to) {
      const highlightClass = comment.resolved
        ? 'comment-resolved'
        : isActive
        ? 'comment-active'
        : 'comment-highlight'

      decorations.push(
        Decoration.inline(from, to, {
          class: highlightClass,
          'data-comment-id': comment.id,
        })
      )
    }
  })

  const decorationSet = DecorationSet.create(state.doc, decorations)

  editor.view.dispatch(
    state.tr.setMeta(CommentExtensionKey, { decorationSet })
  )
}
