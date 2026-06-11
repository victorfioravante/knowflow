// Extensão do Request type do Express
import { Organization, User } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user: User
      organization: Organization
    }
  }
}

export {}
