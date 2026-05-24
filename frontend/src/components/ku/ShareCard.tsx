import { useRef } from 'react'
import html2canvas from 'html2canvas'

interface ShareCardProps {
  ku: {
    line1: string
    line2: string
    line3: string
    users: { username: string }
    hashtags?: string[]
    sketch_url?: string
  }
  onClose: () => void
}

export default function ShareCard({ ku, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#FDFAF4',
      scale: 2
    })
    const link = document.createElement('a')
    link.download = 'ku.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-paper-bg rounded-card p-4 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-secondary">share card</p>
          <button onClick={onClose} className="text-xs text-ink-muted">close</button>
        </div>

        <div
          ref={cardRef}
          style={{ backgroundColor: '#FDFAF4', fontFamily: 'Georgia, serif' }}
          className="border border-paper-border rounded-card p-6 flex flex-col gap-4"
        >
          <div className="border-t border-b border-paper-muted py-4">
            <p style={{ fontSize: 16, color: '#2C2C2A', lineHeight: 2 }}>{ku.line1}</p>
            <p style={{ fontSize: 16, color: '#2C2C2A', lineHeight: 2 }}>{ku.line2}</p>
            <p style={{ fontSize: 16, color: '#2C2C2A', lineHeight: 2 }}>{ku.line3}</p>
          </div>

          {ku.hashtags && ku.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ku.hashtags.map(tag => (
                <span
                  key={tag}
                  style={{ fontSize: 11, color: '#854F0B', background: '#FAEEDA', padding: '2px 8px', borderRadius: 20 }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {ku.sketch_url && (
            <img src={ku.sketch_url} alt="sketch" className="w-full rounded-lg" />
          )}

          <div className="flex items-center justify-between">
            <p style={{ fontSize: 11, color: '#B4B2A9' }}>@{ku.users.username}</p>
            <p style={{ fontSize: 11, color: '#B4B2A9' }}>ku</p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="bg-amber-warm text-paper-card rounded-lg py-2 text-sm font-medium"
        >
          download image
        </button>
      </div>
    </div>
  )
}