interface Props {
  total: number
  current: number // -1 = cover, 0..n-1 = stories
}

export default function StoryProgressBar({ total, current }: Props) {
  if (total === 0) return null

  return (
    <div className="flex flex-1 gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
          <div
            className={`h-full w-full rounded-full bg-white transition-all duration-300 ${
              i <= current ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      ))}
    </div>
  )
}
