import { useState } from 'react'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import type { Block, QuizBlockData } from '@/types'

interface Props {
  block: Block
  onSave: (data: QuizBlockData) => void
}

export default function QuizBlockEditor({ block, onSave }: Props) {
  const initial = block.data as QuizBlockData
  const [data, setData] = useState<QuizBlockData>({
    question: initial.isExample ? '' : initial.question,
    options:
      initial.isExample ? ['', '', '', ''] : initial.options ?? ['', '', '', ''],
    correctIndex: initial.correctIndex ?? 0,
    explanation: initial.isExample ? '' : initial.explanation,
  })
  const save = useDebouncedCallback(onSave)

  function update(next: QuizBlockData) {
    setData(next)
    save(next)
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={data.question}
        placeholder={initial.isExample ? initial.question : 'Pergunta'}
        onChange={(e) => update({ ...data, question: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none"
      />

      <div className="space-y-2">
        {data.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${block.id}`}
              checked={data.correctIndex === index}
              onChange={() => update({ ...data, correctIndex: index })}
              title="Marcar como correta"
              className="h-4 w-4 accent-accent"
            />
            <input
              type="text"
              value={option}
              placeholder={`Opção ${String.fromCharCode(65 + index)}`}
              onChange={(e) => {
                const options = [...data.options]
                options[index] = e.target.value
                update({ ...data, options })
              }}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        ))}
      </div>

      <input
        type="text"
        value={data.explanation ?? ''}
        placeholder="Explicação da resposta (opcional)"
        onChange={(e) => update({ ...data, explanation: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  )
}
