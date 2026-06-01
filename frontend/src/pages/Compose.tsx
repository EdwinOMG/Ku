import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import TopBar from '../components/layout/TopBar'
import SketchCanvas from '../components/ku/SketchCanvas'

const MAX_WORDS = [5, 7, 5]
const LINE_LABELS = ['first light', 'the unfolding', 'last breath']
const PLACEHOLDERS = [
  'five words to begin...',
  'seven words carry the middle...',
  'five words to land gently...',
]

function countWords(text: string) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)![1]
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}

/* ─── Floating Ink Particles ─── */
function InkParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 4,
    opacity: 0.04 + Math.random() * 0.06,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: '#854F0B',
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Progress Quill ─── */
function ProgressQuill({ lines }: { lines: string[] }) {
  const filled = lines.filter(l => l.trim() !== '').length
  const total = lines.reduce((s, l) => s + countWords(l), 0)
  const maxTotal = MAX_WORDS.reduce((a, b) => a + b, 0) // 17
  const pct = Math.min((total / maxTotal) * 100, 100)
  const allComplete = lines.every((l, i) => countWords(l) === MAX_WORDS[i])

  return (
    <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor: filled > i ? '#854F0B' : '#D0CEC6',
              transform: filled > i ? 'scale(1)' : 'scale(0.7)',
              boxShadow: filled > i ? '0 0 6px rgba(133, 79, 11, 0.3)' : 'none',
            }}
          />
        ))}
      </div>
      <div className="flex-1 h-px relative">
        <div className="absolute inset-0 bg-cafe-border rounded-full" />
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: allComplete
              ? 'linear-gradient(90deg, #854F0B, #BA7517, #F5D89A)'
              : 'linear-gradient(90deg, #854F0B, #BA7517)',
            boxShadow: allComplete ? '0 0 10px rgba(245, 216, 154, 0.5)' : 'none',
          }}
        />
      </div>
      <span
        className="text-xs transition-colors duration-300 tabular-nums"
        style={{ color: allComplete ? '#854F0B' : '#B4B2A9' }}
      >
        {total}/{maxTotal}
      </span>
    </div>
  )
}

/* ─── Animated Word Counter ─── */
function WordCounter({ count, max }: { count: number; max: number }) {
  const [pulse, setPulse] = useState(false)
  const prevCount = useRef(count)

  useEffect(() => {
    if (count !== prevCount.current) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 400)
      prevCount.current = count
      return () => clearTimeout(t)
    }
  }, [count])

  const isFull = count === max
  const isOver = count > max

  return (
    <span
      className={`
        text-xs font-mono tabular-nums inline-flex items-center gap-0.5
        transition-all duration-300
        ${pulse ? 'animate-counter-pulse' : ''}
        ${isOver ? 'text-red-400' : isFull ? 'text-amber-warm font-semibold' : 'text-ink-faint'}
      `}
    >
      <span className="transition-transform duration-200" style={{ transform: pulse ? 'scale(1.1)' : 'scale(1)' }}>
        {count}
      </span>
      <span className="text-ink-ghost">/</span>
      <span>{max}</span>
      {isFull && (
        <span className="ml-0.5 animate-scale-in text-amber-tag">✓</span>
      )}
    </span>
  )
}

/* ─── Writing Line ─── */
function WritingLine({
  index,
  value,
  onChange,
  isFocused,
  onFocus,
  onBlur,
}: {
  index: number
  value: string
  onChange: (v: string) => void
  isFocused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wordCount = countWords(value)
  const isFull = wordCount === MAX_WORDS[index]

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${0.15 + index * 0.12}s` }}
    >
      <div
        className={`
          relative rounded-xl transition-all duration-500 ease-out
          ${isFocused
            ? 'bg-cafe-card shadow-warm-lg ring-1 ring-amber-soft/40'
            : 'bg-cafe-warm/60 hover:bg-cafe-warm shadow-warm'
          }
        `}
        style={{
          transform: isFocused ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        {/* Line label */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className={`
            text-xs font-display italic transition-all duration-300
            ${isFocused ? 'text-amber-mid' : 'text-ink-ghost'}
          `}>
            {LINE_LABELS[index]}
          </span>
          <WordCounter count={wordCount} max={MAX_WORDS[index]} />
        </div>

        {/* Textarea */}
        <div className="px-4 pb-3 pt-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            rows={2}
            placeholder={PLACEHOLDERS[index]}
            className={`
              writing-area w-full bg-transparent border-0 resize-none
              focus:outline-none text-ink leading-relaxed
              placeholder:italic placeholder:text-ink-ghost
              transition-all duration-300
            `}
            style={{
              fontSize: isFocused ? '1.05rem' : '0.975rem',
              letterSpacing: isFocused ? '0.015em' : '0.005em',
            }}
          />
        </div>

        {/* Animated bottom line — fills as words are written */}
        <div className="absolute bottom-0 left-3 right-3 h-px">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(wordCount / MAX_WORDS[index]) * 100}%`,
              background: isFull
                ? 'linear-gradient(90deg, transparent, #854F0B, transparent)'
                : 'linear-gradient(90deg, transparent, #C8C3B5, transparent)',
              opacity: wordCount > 0 ? 1 : 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Completion Flourish ─── */
function CompletionFlourish() {
  return (
    <div className="flex justify-center py-2 animate-fade-in">
      <svg width="120" height="16" viewBox="0 0 120 16" className="text-amber-mid">
        <path
          d="M10 8 Q30 2 60 8 Q90 14 110 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          className="animate-draw-line"
        />
        <circle cx="60" cy="8" r="2" fill="currentColor" opacity="0.4" className="animate-scale-in" />
      </svg>
    </div>
  )
}

/* ─── Main Compose ─── */
export default function Compose() {
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [lines, setLines] = useState(['', '', ''])
  const [hashtags, setHashtags] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedLine, setFocusedLine] = useState<number | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const [posted, setPosted] = useState(false)

  const promptState = location.state as {
    promptId?: string
    promptWord?: string
    isDaily?: boolean
  } | null

  const allComplete = lines.every((l, i) => countWords(l) === MAX_WORDS[i])

  const handleLineChange = useCallback((index: number, value: string) => {
    const wordCount = countWords(value)
    if (wordCount > MAX_WORDS[index]) return
    setLines(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }, [])

  const uploadSketch = async (): Promise<string | null> => {
    if (!sketchDataUrl || !user) return null
    const blob = dataURLtoBlob(sketchDataUrl)
    const fileName = `${user.id}/${Date.now()}.png`
    const { error } = await supabase.storage
      .from('sketches')
      .upload(fileName, blob, { contentType: 'image/png', upsert: false })
    if (error) return null
    const { data: urlData } = supabase.storage.from('sketches').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!session) return
    setError('')

    if (lines.some(l => l.trim() === '')) {
      setError('all three lines are required')
      return
    }

    const parsedTags = hashtags
      .split(' ')
      .map(t => t.replace('#', '').trim())
      .filter(t => t.length > 0)

    setLoading(true)
    try {
      const sketchUrl = await uploadSketch()

      await api('/kus', {
        method: 'POST',
        body: JSON.stringify({
          line1: lines[0],
          line2: lines[1],
          line3: lines[2],
          visibility,
          hashtags: parsedTags,
          sketch_url: sketchUrl,
          is_daily: promptState?.isDaily || false,
          prompt_id: promptState?.promptId || null
        })
      }, session.access_token)

      setPosted(true)
      setTimeout(() => navigate('/daily'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* Posted success animation */
  if (posted) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center overflow-hidden relative">
        {/* Success particles */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute animate-drift opacity-40"
            style={{
              left: `${15 + i * 10}%`, top: `${20 + (i * 23) % 50}%`,
              fontSize: `${8 + i * 2}px`, animationDelay: `${i * 0.2}s`, animationDuration: `${2 + i * 0.5}s`
            }}>
            {['✦', '🍃', '✦', '🌿', '✦', '🍂', '✦', '🌱'][i]}
          </div>
        ))}
        <div className="text-center animate-fade-in-up relative z-10">
          <div className="text-5xl mb-4 animate-float">🪶</div>
          <p className="text-ink font-display text-lg italic">your ku is in the world</p>
          <p className="text-ink-faint text-xs mt-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            drifting to the feed...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cafe-bg max-w-lg mx-auto relative overflow-hidden">
      <InkParticles />

      {/* Top Bar */}
      <TopBar
        title={promptState?.promptWord ? `prompt: ${promptState.promptWord}` : 'write a ku'}
        showBack
        right={
          <button
            onClick={handleSubmit}
            disabled={loading || !allComplete}
            className={`
              text-sm font-display font-medium
              px-3 py-1 rounded-lg
              transition-all duration-500
              ${allComplete
                ? 'text-cafe-latte bg-amber-warm shadow-warm hover:shadow-warm-lg active:scale-95'
                : 'text-ink-ghost cursor-not-allowed'
              }
              disabled:opacity-40
            `}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-cafe-latte/50 border-t-cafe-latte rounded-full animate-spin" />
                sending
              </span>
            ) : 'post'}
          </button>
        }
      />

      <div className="relative p-4 flex flex-col gap-4">

        {/* Prompt banner */}
        {promptState?.promptWord && (
          <div className="animate-fade-in-down">
            <div className="bg-amber-light/70 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-amber-glow/30">
              <p className="text-xs text-ink-muted italic">today's prompt</p>
              <p className="text-base font-display font-medium text-amber-warm mt-0.5 tracking-wide">
                {promptState.promptWord}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <ProgressQuill lines={lines} />

        {/* Syllable guide */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs text-ink-ghost font-mono tracking-[0.3em]">5 · 7 · 5</p>
        </div>

        {/* Writing lines */}
        <div className="flex flex-col gap-3">
          {lines.map((line, i) => (
            <WritingLine
              key={i}
              index={i}
              value={line}
              onChange={v => handleLineChange(i, v)}
              isFocused={focusedLine === i}
              onFocus={() => setFocusedLine(i)}
              onBlur={() => setFocusedLine(null)}
            />
          ))}
        </div>

        {/* Completion flourish */}
        {allComplete && <CompletionFlourish />}

        {/* Sketch section */}
        <div
          className="cozy-card p-4 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <SketchCanvas onChange={setSketchDataUrl} />
        </div>

        {/* Extras toggle */}
        <button
          onClick={() => setShowExtras(s => !s)}
          className="flex items-center justify-center gap-2 text-xs text-ink-muted py-2 animate-fade-in hover:text-ink-secondary transition-colors"
          style={{ animationDelay: '0.6s' }}
        >
          <span className={`transition-transform duration-300 ${showExtras ? 'rotate-45' : ''}`}>+</span>
          {showExtras ? 'fewer options' : 'hashtags & visibility'}
        </button>

        {/* Extras panel */}
        <div
          className="overflow-hidden transition-all duration-500 ease-out"
          style={{
            maxHeight: showExtras ? '300px' : '0',
            opacity: showExtras ? 1 : 0,
            transform: showExtras ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          <div className="cozy-card p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary font-display italic">hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="#nature #morning #stillness"
                className="cozy-input"
              />
            </div>

            <div className="ink-divider" />

            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary font-display italic">visibility</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value)}
                className="cozy-input"
              >
                <option value="public">public — for all to read</option>
                <option value="friends">friends only</option>
                <option value="private">private — just for you</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-scale-in">
            <p className="text-red-400/80 text-xs text-center font-display italic bg-red-50/50 rounded-lg py-2">
              {error}
            </p>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  )
}
