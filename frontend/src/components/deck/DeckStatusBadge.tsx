import type { DeckStatus } from '@/types'

const STATUS_CONFIG: Record<DeckStatus, { label: string; classes: string }> = {
  DRAFT: { label: 'Rascunho', classes: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'Em aprovação', classes: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprovado', classes: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejeitado', classes: 'bg-red-100 text-red-700' },
}

export default function DeckStatusBadge({ status }: { status: DeckStatus }) {
  const { label, classes } = STATUS_CONFIG[status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}
