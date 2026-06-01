import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'
import { useWordFilter } from '../../hooks/useWordFilter'

interface Ku {
  id: string; user_id: string; line1: string; line2: string; line3: string
  visibility: string; sketch_url?: string; created_at: string
  users: { username: string; avatar_url?: string }
  likeCount?: number; hashtags?: string[]; isLiked?: boolean
}

const AMBIENT_WORDS = ['stillness', 'bloom', 'whisper', 'drift', 'wonder', 'gentle', 'dusk', 'petals', 'rain']

export default function HomeFeed() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [kus, setKus] = useState<Ku[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { filterKus } = useWordFilter()
  const [wordIndex, setWordIndex] = useState(0)

  const fetchKus = async (pageNum: number) => {
    if (!session) return
    try {
      const data = await api(`/kus/feed/home?page=${pageNum}`, {}, session.access_token)
      if (pageNum === 1) setKus(data.kus)
      else setKus(prev => [...prev, ...data.kus])
      setHasMore(data.kus.length === 20)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchKus(1) }, [session])
  useEffect(() => {
    const interval = setInterval(() => setWordIndex(i => (i + 1) % AMBIENT_WORDS.length), 3000)
    return () => clearInterval(interval)
  }, [])

  const handleDelete = (id: string) => setKus(prev => prev.filter(k => k.id !== id))
  const loadMore = () => { const next = page + 1; setPage(next); fetchKus(next) }

  return (
    <Layout>
      <TopBar
        title="ku"
        right={
          <button
            onClick={() => navigate('/compose')}
            className="w-9 h-9 rounded-xl bg-amber-warm text-cafe-latte flex items-center justify-center text-lg leading-none shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:scale-105 hover:rotate-90 active:scale-95"
          >
            +
          </button>
        }
      />

      <div className="tab-bar">
        <button className="tab-item active">following</button>
      </div>

      <div className="p-3 flex flex-col gap-3 stagger">
        {loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="loading-garden mb-4">
              <div className="text-2xl animate-float" style={{ animationDelay: '0s' }}>🍃</div>
              <div className="text-lg animate-float absolute -left-4 top-2" style={{ animationDelay: '0.5s' }}>🌿</div>
              <div className="text-sm animate-float absolute -right-3 top-4" style={{ animationDelay: '1s' }}>🍂</div>
            </div>
            <div className="shimmer-text">
              <p className="text-ink-muted text-sm font-display italic">gathering kus...</p>
            </div>
            {/* Loading skeletons */}
            <div className="mt-6 space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="skeleton-card animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="skeleton-circle w-8 h-8" />
                    <div className="skeleton-line w-20 h-3" />
                    <div className="skeleton-line w-8 h-2 ml-auto" />
                  </div>
                  <div className="space-y-2 px-2">
                    <div className="skeleton-line w-4/5 h-3" />
                    <div className="skeleton-line w-3/5 h-3 ml-3" />
                    <div className="skeleton-line w-4/5 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && kus.length === 0 && (
          <div className="text-center py-8 animate-fade-in-up">
            {/* Animated garden scene */}
            <div className="empty-garden mx-auto mb-6 relative h-40 flex items-end justify-center">
              {/* Ground */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full bg-gradient-to-r from-transparent via-moss-sage/50 to-transparent" />

              {/* Animated sprout growing */}
              <div className="sprout-container animate-grow-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-5xl animate-sway" style={{ transformOrigin: 'bottom center' }}>🌱</div>
              </div>

              {/* Floating particles around sprout */}
              {[0,1,2,3,4].map(i => (
                <div
                  key={i}
                  className="absolute animate-drift"
                  style={{
                    left: `${30 + i * 10}%`,
                    bottom: `${30 + (i * 17) % 40}%`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${3 + i}s`,
                    fontSize: '6px',
                    opacity: 0.4,
                  }}
                >
                  ✦
                </div>
              ))}

              {/* Little butterflies */}
              <div className="absolute top-4 left-1/4 text-sm animate-butterfly" style={{ animationDelay: '1s' }}>🦋</div>
              <div className="absolute top-12 right-1/4 text-xs animate-butterfly" style={{ animationDelay: '2.5s' }}>🦋</div>
            </div>

            <p className="text-ink-muted text-sm font-display mb-1 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              nothing here yet
            </p>
            <p className="text-ink-ghost text-xs animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              follow some writers to see their kus
            </p>

            {/* Cycling ambient word */}
            <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
              <div className="inline-block px-4 py-2 rounded-full bg-cafe-warm/50 border border-cafe-border/30">
                <p className="text-[10px] text-ink-ghost font-mono tracking-widest uppercase mb-0.5">today's mood</p>
                <p className="text-sm font-display text-amber-warm italic animate-word-cycle" key={wordIndex}>
                  {AMBIENT_WORDS[wordIndex]}
                </p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-6 flex flex-col gap-2 items-center animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
              <button
                onClick={() => navigate('/explore')}
                className="btn-moss text-xs px-6 py-2.5 rounded-full hover:shadow-warm-lg"
              >
                🌿 discover writers
              </button>
              <button
                onClick={() => navigate('/compose')}
                className="text-xs text-ink-muted hover:text-amber-warm transition-all duration-300 font-display italic hover:tracking-wider"
              >
                or write your first ku ✦
              </button>
            </div>
          </div>
        )}

        {filterKus(kus).map(ku => (
          <KuCard key={ku.id} ku={ku} onDelete={handleDelete} />
        ))}

        {hasMore && !loading && kus.length > 0 && (
          <button onClick={loadMore}
            className="text-xs text-ink-muted text-center py-5 hover:text-amber-warm transition-all duration-300 font-display italic group">
            <span className="group-hover:tracking-wider transition-all duration-300">load more</span>
            <span className="block text-[10px] mt-1 opacity-0 group-hover:opacity-50 transition-opacity duration-500">↓</span>
          </button>
        )}
      </div>
    </Layout>
  )
}
