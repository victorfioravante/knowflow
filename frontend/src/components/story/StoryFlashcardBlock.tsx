import { motion } from 'framer-motion'
import { useState } from 'react'
import type { FlashcardBlockData } from '@/types'

export default function StoryFlashcardBlock({ data }: { data: FlashcardBlockData }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="cursor-pointer select-none"
      style={{ perspective: '1000px', minHeight: '180px' }}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
          position: 'relative',
          minHeight: '180px',
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        {/* Frente */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {data.frontImageUrl && (
            <img
              src={data.frontImageUrl}
              className="mb-3 h-20 w-20 rounded-xl object-cover"
              alt=""
            />
          )}
          <p className="font-semibold text-gray-900 text-base leading-snug">{data.front}</p>
          <p className="mt-3 text-xs text-gray-400">Toque para revelar</p>
        </div>

        {/* Verso */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl p-6 text-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: '#1D9E75',
          }}
        >
          <p className="font-semibold text-white text-base leading-snug">{data.back}</p>
        </div>
      </motion.div>
    </div>
  )
}
