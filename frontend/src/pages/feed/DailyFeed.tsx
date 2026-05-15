import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'

interface Ku {
  id: string
  user_id: string
  line1: string
  line2: string
  line3: string
  visibility: string
  sketch_url?: string
  created_at: string
  users: {
    username: string
    avatar_url?: string
  }
  likeCount?: number
  hashtags?: string[]
  isLiked?: boolean
}

interface Prompt {
  id: string
  prompt: string
  date: string
}

export default function DailyFeed() {
  const { session } = useAuth()
  const [kus, setKus] = useState<Ku[]>([])
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const data = await api(
          '/kus/feed/daily',
          {},
          session?.access_token
        )
        setPrompt(data.prompt)
        setKus(data.kus)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDaily()
  }, [])

  return (
    <Layout>
      <TopBar title="daily ku" />

      {prompt && (
        <div className="bg-paper-card border-b border-paper-border px-4 py-4 text-center">
          <p className="text-xs text-ink-muted mb-1">today's prompt</p>
          <p className="text-2xl text-ink font-medium">{prompt.prompt}</p>
        </div>
      )}

      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && !prompt && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm">no prompt today yet</p>
            <p className="text-ink-faint text-xs mt-1">check back soon</p>
          </div>
        )}

        {kus.map(ku => (
          <KuCard key={ku.id} ku={ku} />
        ))}

        {!loading && prompt && kus.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ink-muted text-sm">no kus yet for this prompt</p>
            <p className="text-ink-faint text-xs mt-1">be the first to write one</p>
          </div>
        )}
      </div>
    </Layout>
  )
}