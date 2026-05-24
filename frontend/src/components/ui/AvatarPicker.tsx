interface AvatarPickerProps {
  current?: string
  onSelect: (url: string) => void
}

const PRESET_ICONS = [
  '/icons/avatar-1.svg',
  '/icons/avatar-2.svg',
  '/icons/avatar-3.svg',
  '/icons/avatar-4.svg',
  '/icons/avatar-5.svg',
  '/icons/avatar-6.svg',
  '/icons/avatar-7.svg',
  '/icons/avatar-8.svg',
]

const PLACEHOLDER_COLORS = [
  '#FAEEDA',
  '#E8E3D8',
  '#E1F5EE',
  '#E6F1FB',
  '#FBEAF0',
  '#EAF3DE',
  '#FAECE7',
  '#EEEDFE',
]

export default function AvatarPicker({ current, onSelect }: AvatarPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">choose a profile icon</p>
      <div className="grid grid-cols-4 gap-3">
        {PRESET_ICONS.map((icon, i) => (
          <button
            key={icon}
            onClick={() => onSelect(icon)}
            className={`aspect-square rounded-full border-2 overflow-hidden flex items-center justify-center ${
              current === icon ? 'border-amber-warm' : 'border-transparent'
            }`}
            style={{ background: PLACEHOLDER_COLORS[i] }}
          >
            <img
              src={icon}
              alt={`avatar ${i + 1}`}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-faint">more icons coming soon</p>
    </div>
  )
}