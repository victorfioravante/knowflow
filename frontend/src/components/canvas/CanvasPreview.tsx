// Prévia em tempo real da story selecionada (estilo player)
import type {
  Block,
  FlashcardBlockData,
  ImageBlockData,
  QuizBlockData,
  Story,
  TextBlockData,
  VoiceBlockData,
} from '@/types'

function PreviewBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'TEXT': {
      const data = block.data as TextBlockData
      const text =
        typeof data.content === 'string'
          ? data.content
          : extractText(data.content)
      return <p className="text-lg leading-relaxed">{text || '—'}</p>
    }
    case 'IMAGE': {
      const data = block.data as ImageBlockData
      return data.url ? (
        <img src={data.url} alt={data.alt} className="w-full rounded-xl" />
      ) : null
    }
    case 'VOICE': {
      const data = block.data as VoiceBlockData
      return data.audioUrl ? (
        <audio controls src={data.audioUrl} className="w-full" />
      ) : null
    }
    case 'FLASHCARD': {
      const data = block.data as FlashcardBlockData
      return (
        <div className="rounded-xl bg-white/10 p-4">
          <p className="font-semibold">{data.front || '—'}</p>
          <p className="mt-2 border-t border-white/20 pt-2 text-sm opacity-80">
            {data.back || '—'}
          </p>
        </div>
      )
    }
    case 'QUIZ': {
      const data = block.data as QuizBlockData
      return (
        <div className="space-y-2">
          <p className="font-semibold">{data.question || '—'}</p>
          {data.options.map((option, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                i === data.correctIndex ? 'bg-accent/80' : 'bg-white/10'
              }`}
            >
              {option || `Opção ${String.fromCharCode(65 + i)}`}
            </div>
          ))}
        </div>
      )
    }
  }
}

// Extrai texto puro do JSON do TipTap para a prévia
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; content?: unknown[] }
  if (n.text) return n.text
  return (n.content ?? []).map(extractText).join(' ')
}

interface Props {
  story: Story
  coverColor: string
  onClose: () => void
}

export default function CanvasPreview({ story, coverColor, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-white"
      style={{ backgroundColor: coverColor }}
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/20 px-4 py-2 text-sm font-medium"
        >
          Fechar prévia
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-10">
        {story.blocks.map((block) => (
          <PreviewBlock key={block.id} block={block} />
        ))}
        {story.blocks.length === 0 && (
          <p className="text-center opacity-70">Story vazia</p>
        )}
      </div>
    </div>
  )
}
