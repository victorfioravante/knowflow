import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { TextBlockData } from '@/types'

export default function StoryTextBlock({ data }: { data: TextBlockData }) {
  const editor = useEditor({
    editable: false,
    extensions: [StarterKit],
    content: (data.content as string | object) ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  return (
    <div className="rounded-2xl bg-white p-5">
      <EditorContent editor={editor} />
    </div>
  )
}
