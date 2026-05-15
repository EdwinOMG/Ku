import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title?: string
  showBack?: boolean
  right?: React.ReactNode
}

export default function TopBar({ title = 'ku', showBack = false, right }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-10 bg-paper-nav border-b border-paper-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="text-ink-muted text-sm">
            ← back
          </button>
        )}
        <span className="text-lg font-medium text-ink">{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}