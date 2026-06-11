// Verifica JWT do Supabase e injeta user + organização no request
import { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { supabase } from '../lib/supabase'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Token não fornecido' })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Token inválido' })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { organization: true },
  })
  if (!dbUser) return res.status(401).json({ error: 'Usuário não encontrado' })

  req.user = dbUser
  req.organization = dbUser.organization
  next()
}
