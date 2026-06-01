import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'
import { useWordFilter } from '../../hooks/useWordFilter'
import { useNavigate } from 'react-router-dom'

interface Ku {
  id: string; user_id: string; line1: string; line2: string; line3: string
  visibility: string; sketch_url?: string; created_at: string
  users: { username: string; avatar_url?: string }
  likeCount?: number; hashtags?: string[]; isLiked?: boolean
}

interface Prompt { id: string; prompt: string; date: string }

export default function DailyFeed() {
  const { session, user } = useAuth()
  const [kus, setKus] = useState<Ku[]>([])
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const { filterKus } = useWordFilter()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const data = await api('/kus/feed/daily', {}, session?.access_token)
        setPrompt(data.prompt)
        setKus(data.kus)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchDaily()
  }, [])

  return (
    <Layout>
      <TopBar title="daily ku" />

      {prompt && (
        <div className="bg-cafe-card border-b border-cafe-border px-4 py-6 text-center relative overflow-hidden animate-fade-in">
          {/* Ambient glow behind prompt */}
          <div className="absolute inset-0 bg-cafe-glow opacity-60" />
          {/* Floating sparkles around prompt */}
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="absolute text-amber-glow/40 animate-drift"
              style={{
                left: `${10 + i * 15}%`,
                top: `${15 + (i * 23) % 50}%`,
                fontSize: '8px',
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}>✦</div>
          ))}
          <div className="relative z-10">
            <p className="text-[10px] text-ink-ghost font-mono tracking-[0.25em] uppercase mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>today's prompt</p>
            <p className="text-2xl text-ink font-display font-semibold mb-1 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              {prompt.prompt}
            </p>
            <div className="vine-divider mx-16 my-3 animate-quill-write" style={{ animationDelay: '0.3s' }} />
            {user && (
              <button
                onClick={() => navigate('/compose', {
                  state: { promptId: prompt.id, promptWord: prompt.prompt, isDaily: true }
                })}
                className="btn-warm text-xs px-6 py-2 rounded-full animate-fade-in-up hover:shadow-candle transition-shadow duration-500"
                style={{ animationDelay: '0.3s' }}
              >
                write for this prompt
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-3 flex flex-col gap-3 stagger">
        {loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="relative inline-block mb-4">
              <div className="text-2xl animate-candle-flicker">☀</div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-amber-glow/20 rounded-full blur-sm animate-breathe" />
            </div>
            <div className="shimmer-text">
              <p className="text-ink-muted text-sm font-display italic">catching sunlight...</p>
            </div>
          </div>
        )}
        {!loading && !prompt && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="relative inline-block mb-4">
              <div className="text-4xl animate-float">🌤</div>
              {[0,1,2].map(i => (
                <div key={i} className="absolute text-amber-glow/30 animate-drift"
                  style={{ left: `${-15 + i * 15}px`, top: `${-8 + i * 5}px`, fontSize: '6px', animationDelay: `${i * 0.5}s` }}>
                  ✦
                </div>
              ))}
            </div>
            <p className="text-ink-muted text-sm font-display">no prompt today yet</p>
            <p className="text-ink-ghost text-xs mt-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>check back soon</p>
          </div>
        )}
        {filterKus(kus).map(ku => <KuCard key={ku.id} ku={ku} />)}
        {!loading && prompt && kus.length === 0 && (
          <div className="text-center py-10 animate-fade-in-up">
            <div className="text-2xl mb-2">🌱</div>
            <p className="text-ink-muted text-sm font-display">no kus yet for this prompt</p>
            <p className="text-ink-ghost text-xs mt-1">be the first to write one</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
