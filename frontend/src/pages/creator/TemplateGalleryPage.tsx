import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createDeck, createDeckFromTemplate } from '@/services/decks'
import { listTemplates } from '@/services/templates'

export default function TemplateGalleryPage() {
  const navigate = useNavigate()
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })

  const fromTemplate = useMutation({
    mutationFn: (templateId: string) => createDeckFromTemplate(templateId),
    onSuccess: (deck) => navigate(`/decks/${deck.id}/edit`),
  })

  const blank = useMutation({
    mutationFn: () => createDeck({ title: 'Novo deck' }),
    onSuccess: (deck) => navigate(`/decks/${deck.id}/edit`),
  })

  const busy = fromTemplate.isPending || blank.isPending

  return (
    <div className="px-4 py-6 pb-24">
      <header className="mb-1">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500">
          ← Voltar
        </button>
        <h1 className="mt-2 text-xl font-bold">Como você quer começar?</h1>
        <p className="text-sm text-gray-500">
          Use um template para criar mais rápido ou comece do zero.
        </p>
      </header>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => blank.mutate()}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 p-4 text-left disabled:opacity-60"
        >
          <h3 className="font-semibold">Começar do zero</h3>
          <p className="text-sm text-gray-500">Deck em branco com uma story vazia</p>
        </button>

        {isLoading && (
          <p className="py-6 text-center text-gray-400">Carregando templates...</p>
        )}

        {templates?.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={busy}
            onClick={() => fromTemplate.mutate(template.id)}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{template.name}</h3>
              {template.source === 'ORGANIZATION' && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  Da empresa
                </span>
              )}
            </div>
            {template.description && (
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              {template.structure.length}{' '}
              {template.structure.length === 1 ? 'story' : 'stories'} ·{' '}
              {template.structure.reduce((acc, s) => acc + s.blocks.length, 0)} blocos
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
