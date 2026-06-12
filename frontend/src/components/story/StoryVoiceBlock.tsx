import { useRef, useState } from 'react'
import type { VoiceBlockData } from '@/types'

export default function StoryVoiceBlock({ data }: { data: VoiceBlockData }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  if (!data.audioUrl) return null

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  const onTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  const onEnded = () => {
    setPlaying(false)
    setProgress(100)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
  }

  return (
    <div className="rounded-2xl bg-white p-4">
      <audio
        ref={audioRef}
        src={data.audioUrl}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white text-base"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="h-2 w-full cursor-pointer overflow-hidden rounded-full bg-gray-100"
            onClick={seek}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          {data.transcript && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
              {data.transcript}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-gray-400">
          {formatTime(currentTime)} / {formatTime(data.duration)}
        </span>
      </div>
    </div>
  )
}
