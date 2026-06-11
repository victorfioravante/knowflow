export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'knowflow-media'

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_AUDIO_DURATION_SECONDS = 120 // 2 minutos

export const DEFAULT_COVER_COLOR = '#1D9E75'
