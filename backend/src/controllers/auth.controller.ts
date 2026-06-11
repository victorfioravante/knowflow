import { UserRole } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { supabase } from '../lib/supabase'

export const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: z.nativeEnum(UserRole).default(UserRole.LEARNER),
  sectorId: z.string().cuid().optional(),
  roleId: z.string().cuid().optional(),
})

/**
 * POST /api/auth/verify
 * Verifica o token Supabase e retorna o usuário da plataforma.
 * Se o usuário do Supabase tiver metadados de convite e ainda não existir
 * na base, provisiona o registro (primeiro login após aceitar o convite).
 */
export async function verify(req: Request, res: Response) {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Token não fornecido' })

  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !supabaseUser) return res.status(401).json({ error: 'Token inválido' })

  let user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { organization: true, sector: true, jobRole: true },
  })

  // Provisiona usuário convidado no primeiro login
  if (!user) {
    const meta = supabaseUser.user_metadata ?? {}
    const organizationId = meta.organizationId as string | undefined
    if (!organizationId) {
      return res.status(403).json({ error: 'Usuário sem convite válido' })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })
    if (!organization) {
      return res.status(403).json({ error: 'Organização do convite não encontrada' })
    }

    user = await prisma.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email ?? (meta.email as string),
        name: (meta.name as string) ?? supabaseUser.email ?? 'Sem nome',
        role: (meta.role as UserRole) ?? UserRole.LEARNER,
        organizationId,
        sectorId: (meta.sectorId as string) ?? null,
        roleId: (meta.roleId as string) ?? null,
      },
      include: { organization: true, sector: true, jobRole: true },
    })
  }

  res.json(user)
}

/**
 * POST /api/auth/invite
 * Convida usuário por email (ADMIN | MANAGER).
 * Os dados do convite vão como user_metadata no Supabase e são usados
 * para provisionar o registro no primeiro login.
 */
export async function invite(req: Request, res: Response) {
  const { email, name, role, sectorId, roleId } = req.body as z.infer<typeof inviteSchema>
  const organizationId = req.organization.id

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Já existe um usuário com este email' })
  }

  // Setor e cargo devem pertencer à organização do convidante
  if (sectorId) {
    const sector = await prisma.sector.findFirst({ where: { id: sectorId, organizationId } })
    if (!sector) return res.status(400).json({ error: 'Setor inválido' })
  }
  if (roleId) {
    const jobRole = await prisma.role.findFirst({ where: { id: roleId, organizationId } })
    if (!jobRole) return res.status(400).json({ error: 'Cargo inválido' })
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name, role, organizationId, sectorId, roleId },
    redirectTo: `${process.env.FRONTEND_URL ?? ''}/invite`,
  })
  if (error) {
    return res.status(400).json({ error: `Falha ao enviar convite: ${error.message}` })
  }

  res.status(201).json({ invited: true, email, supabaseId: data.user?.id })
}

/**
 * POST /api/auth/accept-invite/:token
 * Finaliza o convite: valida o access token gerado pelo fluxo de convite
 * do Supabase e cria o registro do usuário na plataforma.
 */
export async function acceptInvite(req: Request, res: Response) {
  const token = req.params.token
  if (!token) return res.status(400).json({ error: 'Token não fornecido' })

  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !supabaseUser) {
    return res.status(401).json({ error: 'Convite inválido ou expirado' })
  }

  const existing = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { organization: true },
  })
  if (existing) return res.json(existing)

  const meta = supabaseUser.user_metadata ?? {}
  const organizationId = meta.organizationId as string | undefined
  if (!organizationId) {
    return res.status(403).json({ error: 'Convite sem organização associada' })
  }

  const user = await prisma.user.create({
    data: {
      supabaseId: supabaseUser.id,
      email: supabaseUser.email ?? (meta.email as string),
      name: (meta.name as string) ?? supabaseUser.email ?? 'Sem nome',
      role: (meta.role as UserRole) ?? UserRole.LEARNER,
      organizationId,
      sectorId: (meta.sectorId as string) ?? null,
      roleId: (meta.roleId as string) ?? null,
    },
    include: { organization: true },
  })

  res.status(201).json(user)
}
