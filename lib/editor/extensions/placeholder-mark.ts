import { Mark, mergeAttributes } from '@tiptap/core'

export interface PlaceholderMarkOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    placeholderMark: {
      /**
       * Set a placeholder mark
       */
      setPlaceholder: (attributes: { id: string; text: string }) => ReturnType
      /**
       * Update a placeholder mark
       */
      updatePlaceholder: (id: string, newText: string) => ReturnType
      /**
       * Remove a placeholder mark
       */
      removePlaceholder: () => ReturnType
    }
  }
}

/**
 * Custom mark for highlighting bracketed placeholders like [PLACEHOLDER_TEXT].
 * Makes them clickable and editable via a popover.
 */
export const PlaceholderMark = Mark.create<PlaceholderMarkOptions>({
  name: 'placeholderMark',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'placeholder-mark',
      },
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-placeholder-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-placeholder-id': attributes.id,
          }
        },
      },
      text: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-placeholder-text'),
        renderHTML: (attributes) => {
          if (!attributes.text) {
            return {}
          }
          return {
            'data-placeholder-text': attributes.text,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'placeholder',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setPlaceholder:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      updatePlaceholder:
        (id, newText) =>
        ({ tr, state }) => {
          const { doc } = state
          let updated = false

          doc.descendants((node, pos) => {
            if (node.isText) {
              node.marks.forEach((mark) => {
                if (mark.type.name === this.name && mark.attrs.id === id) {
                  // Replace the text content
                  tr.replaceWith(
                    pos,
                    pos + node.nodeSize,
                    state.schema.text(newText, node.marks)
                  )
                  updated = true
                }
              })
            }
          })

          return updated
        },
      removePlaceholder:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})
