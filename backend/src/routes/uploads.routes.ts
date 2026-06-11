import { UserRole } from '@prisma/client'
import { Router } from 'express'
import multer from 'multer'
import * as uploads from '../controllers/uploads.controller'
import { MAX_AUDIO_SIZE_BYTES, MAX_IMAGE_SIZE_BYTES } from '../lib/constants'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

const CREATOR_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRIBUTOR] as const

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
})
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES },
})

router.post(
  '/image',
  requireRole(...CREATOR_ROLES),
  imageUpload.single('file'),
  uploads.uploadImage,
)
router.post(
  '/audio',
  requireRole(...CREATOR_ROLES),
  audioUpload.single('file'),
  uploads.uploadAudio,
)

export default router
