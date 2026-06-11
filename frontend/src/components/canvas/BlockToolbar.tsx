// Barra inferior de adição de blocos
import type { BlockType } from '@/types'

const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: string }> = [
  { type: 'TEXT', label: 'Texto', icon: 'T' },
  { type: 'IMAGE', label: 'Imagem', icon: '🖼' },
  { type: 'VOICE', label: 'Voz', icon: '🎙' },
  { type: 'FLASHCARD', label: 'Card', icon: '🃏' },
  { type: 'QUIZ', label: 'Quiz', icon: '❓' },
]

interface Props {
  onAdd: (type: BlockType) => void
  disabled?: boolean
}

export default function BlockToolbar({ onAdd, disabled }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2">
        {BLOCK_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onAdd(type)}
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
