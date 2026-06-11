import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import type { Block, TextBlockData } from '@/types'

interface Props {
  block: Block
  onSave: (data: TextBlockData) => void
}

export default function TextBlockEditor({ block, onSave }: Props) {
  const data = block.data as TextBlockData
  const save = useDebouncedCallback(onSave)

  const editor = useEditor({
    extensions: [StarterKit],
    // Aceita string (exemplo do template) ou JSON do TipTap
    content: (data.content as never) ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm min-h-[80px] max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => save({ content: editor.getJSON() }),
  })

  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2">
      {data.isExample && (
        <p className="mb-1 text-xs italic text-gray-400">
          Exemplo do template — edite para substituir
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
