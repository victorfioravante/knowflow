import { useState } from 'react'
import type { QuizBlockData } from '@/types'

interface Props {
  data: QuizBlockData
  answered: boolean
  onAnswered: (correct: boolean) => void
}

export default function StoryQuizBlock({ data, answered, onAnswered }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (answered) return
    setSelected(index)
    onAnswered(index === data.correctIndex)
  }

  const getOptionClass = (i: number) => {
    const base =
      'w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default'
    if (!answered) {
      return `${base} border-gray-200 bg-white text-gray-800 active:bg-gray-50`
    }
    if (i === data.correctIndex) {
      return `${base} border-green-500 bg-green-50 text-green-800`
    }
    if (i === selected) {
      return `${base} border-red-400 bg-red-50 text-red-700`
    }
    return `${base} border-gray-100 bg-gray-50 text-gray-400`
  }

  return (
    <div className="rounded-2xl bg-white p-5">
      <p className="font-semibold text-gray-900 mb-4 leading-snug">{data.question}</p>
      <div className="space-y-2">
        {data.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            className={getOptionClass(i)}
          >
            <span className="mr-2 font-bold text-gray-400">
              {String.fromCharCode(65 + i)}.
            </span>
            {option}
            {answered && i === data.correctIndex && (
              <span className="ml-2 text-green-600">✓</span>
            )}
            {answered && i === selected && i !== data.correctIndex && (
              <span className="ml-2 text-red-500">✗</span>
            )}
          </button>
        ))}
      </div>
      {answered && data.explanation && (
        <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold">Explicação:</span> {data.explanation}
        </div>
      )}
    </div>
  )
}
