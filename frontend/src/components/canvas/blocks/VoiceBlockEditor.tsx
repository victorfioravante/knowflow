import { useEffect, useState } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { uploadAudio } from '@/services/uploads'
import type { Block, VoiceBlockData } from '@/types'

interface Props {
  block: Block
  onSave: (data: VoiceBlockData) => void
}

function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VoiceBlockEditor({ block, onSave }: Props) {
  const initial = block.data as VoiceBlockData
  const [audioUrl, setAudioUrl] = useState(initial.audioUrl)
  const [savedDuration, setSavedDuration] = useState(initial.duration)
  const [uploading, setUploading] = useState(false)
  const { isRecording, audioBlob, duration, start, stop, reset } = useAudioRecorder()

  // Ao terminar a gravação, envia o webm para o storage
  useEffect(() => {
    if (!audioBlob) return
    let cancelled = false
    setUploading(true)
    uploadAudio(audioBlob)
      .then((url) => {
        if (cancelled) return
        setAudioUrl(url)
        setSavedDuration(duration)
        onSave({ audioUrl: url, duration, transcript: initial.transcript })
        reset()
      })
      .finally(() => !cancelled && setUploading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob])

  return (
    <div className="space-y-2">
      {audioUrl && !isRecording && (
        <div className="flex items-center gap-2">
          <audio controls src={audioUrl} className="w-full" />
          <span className="shrink-0 text-xs text-gray-500">
            {formatSeconds(savedDuration)}
          </span>
        </div>
      )}

      {initial.transcript && !audioUrl && (
        <p className="text-xs italic text-gray-400">{initial.transcript}</p>
      )}

      <div className="flex items-center gap-3">
        {isRecording ? (
          <>
            <button
              type="button"
              onClick={stop}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              ■ Parar
            </button>
            <span className="text-sm font-medium text-red-600">
              {formatSeconds(duration)} / 2:00
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={uploading}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? 'Enviando...' : audioUrl ? '● Regravar' : '● Gravar áudio'}
          </button>
        )}
      </div>
    </div>
  )
}
