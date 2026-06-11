// Container principal do editor de stories
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import * as storiesApi from '@/services/stories'
import type { Block, BlockData, BlockType, Deck, Story } from '@/types'
import BlockToolbar from './BlockToolbar'
import CanvasBlock from './CanvasBlock'
import CanvasPreview from './CanvasPreview'

interface Props {
  deck: Deck
}

export default function CanvasEditor({ deck }: Props) {
  const queryClient = useQueryClient()
  const { selectedStoryId, selectStory, previewOpen, setPreviewOpen } =
    useEditorStore()

  const stories = deck.stories ?? []
  const selectedStory: Story | undefined =
    stories.find((s) => s.id === selectedStoryId) ?? stories[0]

  // Garante uma story selecionada válida
  useEffect(() => {
    if (!selectedStory && stories.length > 0) selectStory(stories[0].id)
    else if (selectedStory && selectedStory.id !== selectedStoryId) {
      selectStory(selectedStory.id)
    }
  }, [selectedStory, selectedStoryId, stories, selectStory])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['deck', deck.id] })

  const addStory = useMutation({
    mutationFn: () => storiesApi.createStory(deck.id),
    onSuccess: (story) => {
      invalidate()
      selectStory(story.id)
    },
  })

  const removeStory = useMutation({
    mutationFn: (storyId: string) => storiesApi.deleteStory(deck.id, storyId),
    onSuccess: () => {
      selectStory(null)
      invalidate()
    },
  })

  const addBlock = useMutation({
    mutationFn: (type: BlockType) =>
      storiesApi.createBlock(selectedStory!.id, type),
    onSuccess: invalidate,
  })

  const removeBlock = useMutation({
    mutationFn: (blockId: string) =>
      storiesApi.deleteBlock(selectedStory!.id, blockId),
    onSuccess: invalidate,
  })

  const saveBlock = useMutation({
    mutationFn: ({ block, data }: { block: Block; data: BlockData }) =>
      storiesApi.updateBlock(block.storyId, block.id, data),
  })

  const reorder = useMutation({
    mutationFn: (blockIds: string[]) =>
      storiesApi.reorderBlocks(selectedStory!.id, blockIds),
    onSuccess: invalidate,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!selectedStory || !over || active.id === over.id) return

    const ids = selectedStory.blocks.map((b) => b.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return

    const next = arrayMove(ids, from, to)
    // Atualização otimista da ordem local
    queryClient.setQueryData<Deck>(['deck', deck.id], (old) => {
      if (!old?.stories) return old
      return {
        ...old,
        stories: old.stories.map((s) =>
          s.id === selectedStory.id
            ? {
                ...s,
                blocks: next.map(
                  (id, index) => ({
                    ...s.blocks.find((b) => b.id === id)!,
                    order: index,
                  }),
                ),
              }
            : s,
        ),
      }
    })
    reorder.mutate(next)
  }

  return (
    <div className="pb-28">
      {/* Strip de stories */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            onClick={() => selectStory(story.id)}
            className={`flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-lg border-2 text-sm font-semibold ${
              selectedStory?.id === story.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
            <span className="text-[10px] font-normal text-gray-400">
              {story.blocks.length} bl.
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => addStory.mutate()}
          disabled={addStory.isPending}
          className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xl text-gray-400"
          aria-label="Adicionar story"
        >
          +
        </button>
      </div>

      {/* Ações da story selecionada */}
      {selectedStory && (
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-sm text-gray-500">
            Story {stories.indexOf(selectedStory) + 1} de {stories.length}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="text-sm font-medium text-primary"
            >
              Prévia
            </button>
            {stories.length > 1 && (
              <button
                type="button"
                onClick={() => removeStory.mutate(selectedStory.id)}
                className="text-sm font-medium text-red-600"
              >
                Excluir story
              </button>
            )}
          </div>
        </div>
      )}

      {/* Blocos da story (drag-and-drop vertical) */}
      {selectedStory && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedStory.blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 px-4">
              {selectedStory.blocks.map((block) => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  onSave={(data) => saveBlock.mutate({ block, data })}
                  onDelete={() => removeBlock.mutate(block.id)}
                />
              ))}
              {selectedStory.blocks.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">
                  Adicione blocos pela barra abaixo
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <BlockToolbar
        onAdd={(type) => addBlock.mutate(type)}
        disabled={!selectedStory || addBlock.isPending}
      />

      {previewOpen && selectedStory && (
        <CanvasPreview
          story={selectedStory}
          coverColor={deck.coverColor}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
