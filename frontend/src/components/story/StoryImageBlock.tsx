import type { ImageBlockData } from '@/types'

export default function StoryImageBlock({ data }: { data: ImageBlockData }) {
  if (!data.url) return null

  return (
    <div className="overflow-hidden rounded-2xl">
      <img
        src={data.url}
        alt={data.alt ?? ''}
        className="w-full object-cover"
        loading="lazy"
      />
    </div>
  )
}
