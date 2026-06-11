import { Request, Response } from 'express'
import { uploadToStorage } from '../services/storage.service'

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const AUDIO_MIMES = ['audio/webm']

// POST /api/uploads/image → Supabase Storage
export async function uploadImage(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' })
  if (!IMAGE_MIMES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Formato de imagem não suportado' })
  }
  const url = await uploadToStorage('images', req.file, req.organization.id)
  res.status(201).json({ url })
}

// POST /api/uploads/audio → Supabase Storage (webm, até 2 min)
export async function uploadAudio(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' })
  if (!AUDIO_MIMES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Áudio deve ser audio/webm' })
  }
  const url = await uploadToStorage('audio', req.file, req.organization.id)
  res.status(201).json({ url })
}
