import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeDeck, saveDeckQuizScore } from '@/services/decks'
import type { Block, Deck, Story } from '@/types'
import StoryCover from './StoryCover'
import StoryFlashcardBlock from './StoryFlashcardBlock'
import StoryImageBlock from './StoryImageBlock'
import StoryProgressBar from './StoryProgressBar'
import StoryQuizBlock from './StoryQuizBlock'
import StoryTextBlock from './StoryTextBlock'
import StoryVoiceBlock from './StoryVoiceBlock'

interface Props {
  deck: Deck
}

export default function StoryPlayer({ deck }: Props) {
  const navigate = useNavigate()
  const stories: Story[] = deck.stories ?? []

  const [currentIndex, setCurrentIndex] = useState(-1) // -1 = capa
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Set<string>>(new Set())
  const [quizResults, setQuizResults] = useState<Map<string, boolean>>(new Map())
  const [completed, setCompleted] = useState(false)
  const [completionScore, setCompletionScore] = useState<number | null>(null)

  const completeMutation = useMutation({ mutationFn: () => completeDeck(deck.id) })
  const scoreMutation = useMutation({
    mutationFn: (score: number) => saveDeckQuizScore(deck.id, score),
  })

  const currentStory: Story | null = currentIndex >= 0 ? (stories[currentIndex] ?? null) : null
  const quizBlocksNow: Block[] =
    currentStory?.blocks.filter((b) => b.type === 'QUIZ') ?? []
  const canAdvanceNow =
    currentIndex < 0 || quizBlocksNow.every((b) => answeredQuizzes.has(b.id))

  const handleQuizAnswered = (blockId: string, correct: boolean) => {
    setAnsweredQuizzes((prev) => new Set([...prev, blockId]))
    setQuizResults((prev) => new Map([...prev, [blockId, correct]]))
  }

  const handleNext = () => {
    if (!canAdvanceNow) return

    if (currentIndex >= stories.length - 1) {
      const allQuiz = stories.flatMap((s) => s.blocks.filter((b) => b.type === 'QUIZ'))
      const correct = [...quizResults.values()].filter(Boolean).length
      const score = allQuiz.length > 0 ? Math.round((correct / allQuiz.length) * 100) : null

      completeMutation.mutate()
      if (score !== null) scoreMutation.mutate(score)
      setCompletionScore(score)
      setCompleted(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex <= -1) return
    setCurrentIndex((i) => i - 1)
  }

  const nextLabel =
    currentIndex < 0
      ? 'Começar'
      : currentIndex === stories.length - 1
        ? 'Concluir'
        : 'Próximo'

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-center">Concluído!</h2>
        <p className="mt-2 text-gray-500 text-center">{deck.title}</p>
        {completionScore !== null && (
          <div className="mt-4 rounded-2xl bg-accent/10 px-6 py-3 text-center">
            <p className="text-3xl font-bold text-accent">{completionScore}%</p>
            <p className="text-sm text-gray-500 mt-0.5">de acertos no quiz</p>
          </div>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full max-w-xs rounded-2xl bg-primary px-6 py-3.5 font-semibold text-white"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="shrink-0 text-white/60 hover:text-white/90 text-xl leading-none transition-colors"
          aria-label="Fechar"
        >
          ✕
        </button>
        <StoryProgressBar total={stories.length} current={currentIndex} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {currentIndex === -1 ? (
              <StoryCover deck={deck} />
            ) : currentStory ? (
              <div className="space-y-3 pb-2">
                {currentStory.blocks.map((block) => (
                  <div key={block.id}>
                    {block.type === 'TEXT' && (
                      <StoryTextBlock data={block.data as never} />
                    )}
                    {block.type === 'IMAGE' && (
                      <StoryImageBlock data={block.data as never} />
                    )}
                    {block.type === 'VOICE' && (
                      <StoryVoiceBlock data={block.data as never} />
                    )}
                    {block.type === 'FLASHCARD' && (
                      <StoryFlashcardBlock data={block.data as never} />
                    )}
                    {block.type === 'QUIZ' && (
                      <StoryQuizBlock
                        data={block.data as never}
                        answered={answeredQuizzes.has(block.id)}
                        onAnswered={(correct) => handleQuizAnswered(block.id, correct)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-2 px-4 pb-10 pt-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex <= -1}
          className="rounded-2xl border border-white/20 px-4 py-3.5 text-sm font-medium text-white/70 disabled:opacity-20 transition-opacity"
          aria-label="Anterior"
        >
          ←
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvanceNow}
          className="flex-1 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
