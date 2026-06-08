import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import TopBar from '../components/layout/TopBar'
import { getRandomPrompt } from '../lib/explorePrompts'

const MAX_WORDS = [5, 7, 5]
const LINE_LABELS = ['first light', 'the unfolding', 'last breath']
const PLACEHOLDERS = [
  'five words to begin...',
  'seven words carry the middle...',
  'five words to land gently...',
]

const NOTE_COLORS = [
  { name: 'honey',    value: '#FFE082' },
  { name: 'cream',    value: '#FFF8EC' },
  { name: 'blush',    value: '#F9D5C5' },
  { name: 'sage',     value: '#D1E8D0' },
  { name: 'sky',      value: '#D6EEF7' },
  { name: 'lavender', value: '#E8D5F0' },
]

const DRAW_COLORS = [
  { name: 'ink',   value: '#2A261F' },
  { name: 'amber', value: '#8B5E1E' },
  { name: 'sage',  value: '#5C7044' },
  { name: 'rose',  value: '#9E5050' },
  { name: 'slate', value: '#4A6B8A' },
]

function countWords(text: string) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)![1]
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

/* ─── Floating Ink Particles ─── */
function InkParticles() {
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 4,
    opacity: 0.04 + Math.random() * 0.06,
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`, top: `${p.top}%`,
            width: p.size, height: p.size,
            backgroundColor: '#854F0B', opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Draw Canvas (overlay on top of sticky note content) ─── */
function DrawCanvas({
  canvasRef,
  penColor,
  penSize,
  isErasing,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  penColor: string
  penSize: number
  isErasing: boolean
}) {
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => ({
    x: e.nativeEvent.offsetX,
    y: e.nativeEvent.offsetY,
  })

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    isDrawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, penSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = penColor
    ctx.fill()
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => {
    isDrawing.current = false
    lastPos.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-sm touch-none"
      style={{ cursor: isErasing ? 'cell' : 'crosshair', zIndex: 1 }}
      onPointerDown={startDraw}
      onPointerMove={draw}
      onPointerUp={stopDraw}
      onPointerLeave={stopDraw}
    />
  )
}

/* ─── Sticky Note ─── */
function StickyNote({
  color, committedLines, animating, animatingText, currentStep,
  canvasRef, penColor, penSize, isErasing, isDrawable,
}: {
  color: string
  committedLines: string[]
  animating: boolean
  animatingText: string
  currentStep: number | 'done'
  isDrawable?: boolean
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
  penColor?: string
  penSize?: number
  isErasing?: boolean
}) {
  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: 'min(300px, 88vw)',
        minHeight: '200px',
        backgroundColor: color,
        backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.065) 32px)`,
        backgroundSize: '100% 32px',
        backgroundPosition: '0 46px',
        transform: 'rotate(1.5deg)',
        borderRadius: '2px',
        boxShadow: '3px 6px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)',
        padding: '28px 22px 28px',
      }}
    >
      {/* Top adhesive band */}
      <div
        className="absolute top-0 left-0 right-0 h-2 rounded-t-sm"
        style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
      />

      {/* Poem lines */}
      <div className="flex flex-col gap-6 relative" style={{ zIndex: 2, pointerEvents: 'none' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="relative" style={{ height: '28px' }}>
            {committedLines[i] ? (
              <p
                className="font-body text-base leading-7 animate-fade-in"
                style={{ color: '#2A261F', letterSpacing: '0.01em' }}
              >
                {committedLines[i]}
              </p>
            ) : i === currentStep && animating ? (
              <div className="relative overflow-visible">
                <span
                  className="font-body text-base leading-7 block"
                  style={{
                    color: '#2A261F',
                    letterSpacing: '0.01em',
                    animation: 'penReveal 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}
                >
                  {animatingText}
                </span>
                <span
                  className="absolute top-0"
                  style={{
                    fontSize: '15px',
                    lineHeight: '28px',
                    animation: 'penTraverse 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  🖊
                </span>
              </div>
            ) : (
              <div
                className="absolute bottom-0 left-0 right-0 h-px rounded-full"
                style={{ background: 'rgba(0,0,0,0.12)', opacity: 0.5 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Draw canvas overlay */}
      {isDrawable && canvasRef && (
        <DrawCanvas
          canvasRef={canvasRef}
          penColor={penColor ?? '#2A261F'}
          penSize={penSize ?? 2}
          isErasing={isErasing ?? false}
        />
      )}
    </div>
  )
}

/* ─── Color Picker ─── */
function NoteColorPicker({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex justify-center gap-3">
      {NOTE_COLORS.map(c => (
        <button
          key={c.name}
          onClick={() => onSelect(c.value)}
          className="w-6 h-6 rounded-full transition-all duration-200"
          style={{
            backgroundColor: c.value,
            transform: selected === c.value ? 'scale(1.25)' : 'scale(1)',
            boxShadow: selected === c.value
              ? '0 0 0 2px rgba(42,38,31,0.25), 0 2px 6px rgba(0,0,0,0.15)'
              : '0 1px 3px rgba(0,0,0,0.12)',
            opacity: selected === c.value ? 1 : 0.65,
          }}
          aria-label={c.name}
        />
      ))}
    </div>
  )
}

/* ─── Drawing Toolbar ─── */
function DrawToolbar({
  penColor, penSize, isErasing,
  onColorChange, onSizeChange, onToggleEraser, onClear,
}: {
  penColor: string
  penSize: number
  isErasing: boolean
  onColorChange: (c: string) => void
  onSizeChange: (s: number) => void
  onToggleEraser: () => void
  onClear: () => void
}) {
  return (
    <div className="flex items-center justify-between w-full px-1 animate-fade-in">
      {/* Ink colors */}
      <div className="flex gap-2 items-center">
        {DRAW_COLORS.map(c => {
          const active = penColor === c.value && !isErasing
          return (
            <button
              key={c.name}
              onClick={() => onColorChange(c.value)}
              className="rounded-full transition-all duration-200"
              style={{
                width: active ? '22px' : '18px',
                height: active ? '22px' : '18px',
                backgroundColor: c.value,
                boxShadow: active
                  ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 3.5px rgba(42,38,31,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.2)',
                opacity: active ? 1 : 0.55,
              }}
              aria-label={c.name}
            />
          )
        })}
      </div>

      {/* Right side: sizes + eraser + clear */}
      <div className="flex items-center gap-3">
        {/* Sizes */}
        <div className="flex items-center gap-1.5">
          {[2, 5].map(s => (
            <button
              key={s}
              onClick={() => onSizeChange(s)}
              className="flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: s === 2 ? '10px' : '14px',
                height: s === 2 ? '10px' : '14px',
                backgroundColor: '#2A261F',
                opacity: penSize === s && !isErasing ? 1 : 0.25,
                boxShadow: penSize === s && !isErasing ? '0 0 0 1.5px rgba(42,38,31,0.3)' : 'none',
              }}
              aria-label={`size ${s}`}
            />
          ))}
        </div>

        {/* Eraser */}
        <button
          onClick={onToggleEraser}
          className={`text-[11px] font-mono px-2 py-0.5 rounded-full transition-all duration-200 ${
            isErasing
              ? 'bg-ink/10 text-ink font-semibold'
              : 'text-ink-ghost hover:text-ink-muted'
          }`}
        >
          erase
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          className="text-[11px] font-mono text-ink-ghost hover:text-ink-muted transition-colors"
        >
          clear
        </button>
      </div>
    </div>
  )
}

/* ─── Animated Word Counter ─── */
function WordCounter({ count, max }: { count: number; max: number }) {
  const isFull = count === max
  return (
    <span className={`text-xs font-mono tabular-nums transition-colors duration-300 ${isFull ? 'text-amber-warm font-semibold' : 'text-ink-faint'}`}>
      {count}/{max}{isFull && <span className="ml-0.5 text-amber-tag">✓</span>}
    </span>
  )
}

/* ─── Main ─── */
export default function Compose() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const promptState = location.state as {
    promptId?: string
    promptWord?: string
    isDaily?: boolean
  } | null

  const isExplore = !promptState?.isDaily

  const [step, setStep] = useState<0 | 1 | 2 | 'done'>(0)
  const [committedLines, setCommittedLines] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].value)
  const [animating, setAnimating] = useState(false)
  const [animatingText, setAnimatingText] = useState('')
  const [linePrompts, setLinePrompts] = useState<[string | null, string | null, string | null]>([null, null, null])

  // Drawing state
  const [penColor, setPenColor] = useState(DRAW_COLORS[0].value)
  const [penSize, setPenSize] = useState(2)
  const [isErasing, setIsErasing] = useState(false)

  // Post state
  const [showExtras, setShowExtras] = useState(false)
  const [hashtags, setHashtags] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [posted, setPosted] = useState(false)

  const wordCount = step !== 'done' ? countWords(currentInput) : 0
  const isLineComplete = step !== 'done' && wordCount === MAX_WORDS[step as 0 | 1 | 2]

  useEffect(() => {
    if (step !== 'done' && !animating) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [step, animating])

  const refreshLinePrompt = useCallback((index: number) => {
    setLinePrompts(prev => {
      const updated = [...prev] as [string | null, string | null, string | null]
      updated[index] = getRandomPrompt(prev)
      return updated
    })
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const handleNext = () => {
    if (step === 'done' || !isLineComplete) return
    const text = currentInput.trim()
    setAnimatingText(text)
    setCurrentInput('')
    setAnimating(true)
    setTimeout(() => {
      setCommittedLines(prev => [...prev, text])
      setAnimating(false)
      if (step === 2) {
        setStep('done')
      } else {
        setStep((step + 1) as 0 | 1 | 2)
      }
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isLineComplete) handleNext()
    }
  }

  const uploadDrawing = (): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const canvas = canvasRef.current
        if (!canvas || !session) return resolve(null)
        if (canvas.width === 0 || canvas.height === 0) return resolve(null)
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasContent = imageData.data.some((v, i) => i % 4 === 3 && v > 0)
        if (!hasContent) return resolve(null)
        const dataUrl = canvas.toDataURL('image/png')
        const blob = dataURLtoBlob(dataUrl)
        const fileName = `${session.user.id}/${Date.now()}_sketch.png`
        const timer = setTimeout(() => resolve(null), 8000)
        supabase.storage
          .from('sketches')
          .upload(fileName, blob, { contentType: 'image/png', upsert: false })
          .then(({ error: uploadError }) => {
            clearTimeout(timer)
            if (uploadError) return resolve(null)
            resolve(supabase.storage.from('sketches').getPublicUrl(fileName).data.publicUrl)
          })
          .catch(() => {
            clearTimeout(timer)
            resolve(null)
          })
      } catch {
        resolve(null)
      }
    })
  }

  const handleSubmit = async () => {
    if (!session || committedLines.length < 3 || loading) return
    setError('')
    const parsedTags = hashtags
      .split(' ')
      .map(t => t.replace('#', '').trim())
      .filter(t => t.length > 0)
    setLoading(true)
    try {
      const sketchUrl = await uploadDrawing()
      await api('/kus', {
        method: 'POST',
        body: JSON.stringify({
          line1: committedLines[0],
          line2: committedLines[1],
          line3: committedLines[2],
          visibility,
          hashtags: parsedTags,
          sketch_url: sketchUrl,
          note_color: noteColor,
          is_daily: promptState?.isDaily || false,
          prompt_id: promptState?.promptId || null,
        }),
      }, session.access_token)
      setPosted(true)
      setTimeout(() => navigate('/daily'), 1200)
    } catch (err: any) {
      setError(err?.message || 'something went wrong — try again')
    } finally {
      setLoading(false)
    }
  }

  if (posted) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center overflow-hidden relative">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute animate-drift opacity-40"
            style={{ left: `${15 + i * 10}%`, top: `${20 + (i * 23) % 50}%`, fontSize: `${8 + i * 2}px`, animationDelay: `${i * 0.2}s`, animationDuration: `${2 + i * 0.5}s` }}>
            {['✦', '🍃', '✦', '🌿', '✦', '🍂', '✦', '🌱'][i]}
          </div>
        ))}
        <div className="text-center animate-fade-in-up relative z-10">
          <div className="text-5xl mb-4 animate-float">🪶</div>
          <p className="text-ink font-display text-lg italic">your ku is in the world</p>
          <p className="text-ink-faint text-xs mt-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>drifting to the feed...</p>
        </div>
      </div>
    )
  }

  const currentStepNum = step === 'done' ? 3 : (step as number)

  return (
    <div className="min-h-screen bg-cafe-bg max-w-lg mx-auto relative overflow-hidden flex flex-col">
      <InkParticles />

      <TopBar
        title={promptState?.promptWord ? `prompt: ${promptState.promptWord}` : 'write a ku'}
        showBack
      />

      <div className="flex-1 flex flex-col items-center px-4 pt-8 gap-6 pb-52">

        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: currentStepNum > i ? '20px' : '8px',
                height: '8px',
                backgroundColor: currentStepNum > i ? '#8B5E1E' : currentStepNum === i ? '#A06D24' : '#D0CEC6',
                opacity: currentStepNum === i ? 1 : currentStepNum > i ? 0.7 : 0.4,
              }}
            />
          ))}
        </div>

        {/* Note color picker */}
        <NoteColorPicker selected={noteColor} onSelect={setNoteColor} />

        {/* Daily prompt label */}
        {promptState?.promptWord && (
          <p className="text-xs text-amber-warm font-mono tracking-widest animate-fade-in">
            ✦ {promptState.promptWord}
          </p>
        )}

        {/* Sticky note */}
        <StickyNote
          color={noteColor}
          committedLines={committedLines}
          animating={animating}
          animatingText={animatingText}
          currentStep={step}
          isDrawable={step === 'done'}
          canvasRef={canvasRef}
          penColor={penColor}
          penSize={penSize}
          isErasing={isErasing}
        />

        {/* Drawing toolbar — shown when done */}
        {step === 'done' && (
          <DrawToolbar
            penColor={penColor}
            penSize={penSize}
            isErasing={isErasing}
            onColorChange={c => { setPenColor(c); setIsErasing(false) }}
            onSizeChange={setPenSize}
            onToggleEraser={() => setIsErasing(e => !e)}
            onClear={clearCanvas}
          />
        )}

        {/* Done state: hashtags / visibility */}
        {step === 'done' && (
          <div className="w-full flex flex-col gap-3 animate-fade-in-up">
            <button
              onClick={() => setShowExtras(s => !s)}
              className="flex items-center justify-center gap-2 text-xs text-ink-muted py-1 hover:text-ink-secondary transition-colors"
            >
              <span className={`transition-transform duration-300 ${showExtras ? 'rotate-45' : ''}`}>+</span>
              {showExtras ? 'fewer options' : 'hashtags & visibility'}
            </button>
            <div
              className="overflow-hidden transition-all duration-500 ease-out"
              style={{ maxHeight: showExtras ? '200px' : '0', opacity: showExtras ? 1 : 0 }}
            >
              <div className="cozy-card p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-ink-secondary font-display italic">hashtags</label>
                  <input
                    type="text" value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    placeholder="#nature #morning #stillness"
                    className="cozy-input"
                  />
                </div>
                <div className="ink-divider" />
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-ink-secondary font-display italic">visibility</label>
                  <select value={visibility} onChange={e => setVisibility(e.target.value)} className="cozy-input">
                    <option value="public">public — for all to read</option>
                    <option value="friends">friends only</option>
                    <option value="private">private — just for you</option>
                  </select>
                </div>
              </div>
            </div>
            {error && (
              <p className="text-red-400/80 text-xs text-center font-display italic bg-red-50/50 rounded-lg py-2">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fixed bottom: line input */}
      {step !== 'done' && !animating && (
        <div
          className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t border-cafe-border px-4 pt-3 pb-6"
          style={{ backgroundColor: 'rgba(232, 224, 208, 0.97)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-display italic text-ink-ghost">
                {LINE_LABELS[step as number]}
              </span>
              {isExplore && linePrompts[step as number] ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-glow/80 text-wood-dark font-mono font-medium tracking-wide">
                    {linePrompts[step as number]}
                  </span>
                  <button
                    type="button"
                    onClick={() => refreshLinePrompt(step as number)}
                    className="text-[10px] text-ink-muted hover:text-amber-mid transition-colors"
                  >
                    ↺ new
                  </button>
                </div>
              ) : isExplore ? (
                <button
                  type="button"
                  onClick={() => refreshLinePrompt(step as number)}
                  className="text-[11px] text-ink-ghost hover:text-amber-warm transition-colors"
                  aria-label="get prompt inspiration"
                >
                  ✦
                </button>
              ) : null}
            </div>
            <WordCounter count={wordCount} max={MAX_WORDS[step as number]} />
          </div>

          <textarea
            ref={inputRef}
            value={currentInput}
            onChange={e => {
              if (countWords(e.target.value) <= MAX_WORDS[step as number]) setCurrentInput(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={PLACEHOLDERS[step as number]}
            className="w-full bg-transparent border-0 resize-none focus:outline-none text-ink text-base leading-relaxed placeholder:italic placeholder:text-ink-ghost"
          />

          <div className="flex justify-end mt-1">
            <button
              onClick={handleNext}
              disabled={!isLineComplete}
              className={`text-sm font-display px-5 py-1.5 rounded-lg transition-all duration-300 ${
                isLineComplete
                  ? 'text-cafe-latte bg-amber-warm shadow-warm hover:shadow-warm-lg active:scale-95'
                  : 'text-ink-ghost cursor-not-allowed opacity-40'
              }`}
            >
              {step === 2 ? 'finish →' : 'next →'}
            </button>
          </div>
        </div>
      )}

      {/* Fixed bottom: post button */}
      {step === 'done' && (
        <div
          className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t border-cafe-border px-4 pt-3 pb-6 animate-slide-up"
          style={{ backgroundColor: 'rgba(232, 224, 208, 0.97)', backdropFilter: 'blur(8px)' }}
        >
          {error && (
            <p className="text-red-400/80 text-xs text-center font-display italic mb-2">
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-cafe-latte bg-amber-warm font-display font-medium tracking-wide shadow-warm hover:shadow-warm-lg active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-cafe-latte/50 border-t-cafe-latte rounded-full animate-spin" />
                posting...
              </span>
            ) : 'post ku'}
          </button>
        </div>
      )}

      {/* Animating overlay hint */}
      {animating && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 flex justify-center animate-fade-in">
          <p className="text-xs text-ink-ghost font-display italic">writing...</p>
        </div>
      )}
    </div>
  )
}
