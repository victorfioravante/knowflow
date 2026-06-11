// Wrapper de bloco com drag handle
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, BlockData, BlockType } from '@/types'
import FlashcardBlockEditor from './blocks/FlashcardBlockEditor'
import ImageBlockEditor from './blocks/ImageBlockEditor'
import QuizBlockEditor from './blocks/QuizBlockEditor'
import TextBlockEditor from './blocks/TextBlockEditor'
import VoiceBlockEditor from './blocks/VoiceBlockEditor'

const TYPE_LABELS: Record<BlockType, string> = {
  TEXT: 'Texto',
  IMAGE: 'Imagem',
  VOICE: 'Voz',
  FLASHCARD: 'Flashcard',
  QUIZ: 'Quiz',
}

interface Props {
  block: Block
  onSave: (data: BlockData) => void
  onDelete: () => void
}

export default function CanvasBlock({ block, onSave, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded p-1 text-gray-400 active:cursor-grabbing"
            aria-label="Arrastar para reordenar"
          >
            ⠿
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {TYPE_LABELS[block.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-xs text-gray-400 hover:text-red-600"
          aria-label="Remover bloco"
        >
          ✕
        </button>
      </div>

      {block.type === 'TEXT' && <TextBlockEditor block={block} onSave={onSave} />}
      {block.type === 'IMAGE' && <ImageBlockEditor block={block} onSave={onSave} />}
      {block.type === 'VOICE' && <VoiceBlockEditor block={block} onSave={onSave} />}
      {block.type === 'FLASHCARD' && (
        <FlashcardBlockEditor block={block} onSave={onSave} />
      )}
      {block.type === 'QUIZ' && <QuizBlockEditor block={block} onSave={onSave} />}
    </div>
  )
}
