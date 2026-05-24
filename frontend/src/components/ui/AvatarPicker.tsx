import { useRef } from 'react'

interface AvatarPickerProps {
  current?: string
  onSelect: (url: string) => void
}

const DEFAULT_AVATAR = '/icons/avatar-1.svg'

export default function AvatarPicker({ current, onSelect }: AvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onSelect(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">choose a profile picture</p>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-ink-faint">default</p>
        <button
          onClick={() => onSelect(DEFAULT_AVATAR)}
          className={`w-14 h-14 rounded-full border-2 overflow-hidden ${
            current === DEFAULT_AVATAR ? 'border-amber-warm' : 'border-transparent'
          }`}
        >
          <img src={DEFAULT_AVATAR} alt="default avatar" className="w-full h-full object-cover" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-ink-faint">or upload your own</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-paper-bg border border-paper-border rounded-lg px-4 py-2 text-xs text-ink-secondary text-left"
        >
          choose image (jpg, png, max 2MB)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}