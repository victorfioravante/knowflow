import { useState } from 'react'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import type { Block, FlashcardBlockData } from '@/types'

interface Props {
  block: Block
  onSave: (data: FlashcardBlockData) => void
}

export default function FlashcardBlockEditor({ block, onSave }: Props) {
  const initial = block.data as FlashcardBlockData
  const [front, setFront] = useState(initial.isExample ? '' : initial.front)
  const [back, setBack] = useState(initial.isExample ? '' : initial.back)
  const save = useDebouncedCallback((f: string, b: string) =>
    onSave({ front: f, back: b, frontImageUrl: initial.frontImageUrl }),
  )

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Frente</label>
        <textarea
          value={front}
          placeholder={initial.isExample ? initial.front : 'Pergunta ou termo'}
          onChange={(e) => {
            setFront(e.target.value)
            save(e.target.value, back)
          }}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Verso</label>
        <textarea
          value={back}
          placeholder={initial.isExample ? initial.back : 'Resposta ou definição'}
          onChange={(e) => {
            setBack(e.target.value)
            save(front, e.target.value)
          }}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  )
}
