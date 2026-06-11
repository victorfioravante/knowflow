import { ChangeEvent, useState } from 'react'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { uploadImage } from '@/services/uploads'
import type { Block, ImageBlockData } from '@/types'

interface Props {
  block: Block
  onSave: (data: ImageBlockData) => void
}

export default function ImageBlockEditor({ block, onSave }: Props) {
  const initial = block.data as ImageBlockData
  const [url, setUrl] = useState(initial.url)
  const [alt, setAlt] = useState(initial.alt ?? '')
  const [uploading, setUploading] = useState(false)
  const saveAlt = useDebouncedCallback((value: string) => onSave({ url, alt: value }))

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadedUrl = await uploadImage(file)
      setUrl(uploadedUrl)
      onSave({ url: uploadedUrl, alt })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {url ? (
        <img src={url} alt={alt} className="max-h-64 w-full rounded-lg object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-400">
          {initial.alt ? `Sugestão: ${initial.alt}` : 'Nenhuma imagem'}
        </div>
      )}
      <label className="block">
        <span className="inline-block cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium">
          {uploading ? 'Enviando...' : url ? 'Trocar imagem' : 'Escolher imagem'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={handleFile}
        />
      </label>
      <input
        type="text"
        placeholder="Texto alternativo (acessibilidade)"
        value={alt}
        onChange={(e) => {
          setAlt(e.target.value)
          saveAlt(e.target.value)
        }}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  )
}
