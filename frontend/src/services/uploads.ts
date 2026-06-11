import { api } from './api'

async function upload(endpoint: string, file: Blob, filename: string) {
  const form = new FormData()
  form.append('file', file, filename)
  const { data } = await api.post<{ url: string }>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

export function uploadImage(file: File) {
  return upload('/uploads/image', file, file.name)
}

// Áudio sempre em audio/webm (gravado pelo MediaRecorder)
export function uploadAudio(blob: Blob) {
  return upload('/uploads/audio', blob, 'recording.webm')
}
