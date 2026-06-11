// Upload Supabase Storage
import { randomUUID } from 'crypto'
import { STORAGE_BUCKET } from '../lib/constants'
import { supabase } from '../lib/supabase'

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'audio/webm': 'webm',
}

export async function uploadToStorage(
  folder: 'images' | 'audio',
  file: Express.Multer.File,
  organizationId: string,
): Promise<string> {
  const ext = EXT_BY_MIME[file.mimetype] ?? 'bin'
  const path = `${organizationId}/${folder}/${randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype })
  if (error) throw new Error(`Falha no upload: ${error.message}`)

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
