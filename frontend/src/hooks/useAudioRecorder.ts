// Gravação de áudio com MediaRecorder API (audio/webm, limite de 2 min)
import { useRef, useState } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
      stream.getTracks().forEach((t) => t.stop())
    }

    recorder.start()
    setIsRecording(true)
    setAudioBlob(null)
    setDuration(0)

    let secs = 0
    timerRef.current = setInterval(() => {
      secs++
      setDuration(secs)
      if (secs >= 120) stop() // limite de 2 minutos
    }, 1000)
  }

  const reset = () => {
    setAudioBlob(null)
    setDuration(0)
  }

  return { isRecording, audioBlob, duration, start, stop, reset }
}
