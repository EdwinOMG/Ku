import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'
import KuCard from '../components/ku/KuCard'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  users: {
    username: string
    avatar_url?: string
  }
}

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

export default function KuPage() {
  const { id } = useParams<{ id: string }>()
  const { session, user } = useAuth()
  const [ku, setKu] = useState<Ku | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchKu = async () => {
      setLoading(true)
      try {
        const [kuData, commentData] = await Promise.all([
          api(`/kus/${id}`, {}, session?.access_token),
          api(`/comments/${id}`, {}, session?.access_token)
        ])
        console.log('kuData:', kuData)
        console.log('commentData:', commentData)
        setKu(kuData.ku)
        setComments(commentData.comments)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    
    if (id) fetchKu()
  }, [id, session])

  const handleComment = async () => {
    if (!session || !newComment.trim()) return
    setPosting(true)
    setError('')
    try {
      const data = await api(`/comments/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment })
      }, session.access_token)
      setComments(prev => [...prev, data.comment])
      setNewComment('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session) return
    try {
      await api(`/comments/${commentId}`, {
        method: 'DELETE'
      }, session.access_token)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      console.error(err)
    }
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <Layout>
      <TopBar title="ku" showBack />

      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {ku && <KuCard ku={ku} />}

        {!loading && (
          <div className="bg-paper-card border border-paper-border rounded-card p-4">
            <p className="text-xs font-medium text-ink-secondary mb-3">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </p>

            {comments.length === 0 && (
              <p className="text-xs text-ink-faint mb-3">no comments yet — be the first</p>
            )}

            <div className="flex flex-col gap-3 mb-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-paper-muted flex items-center justify-center text-xs font-medium text-ink-secondary flex-shrink-0 mt-0.5">
                    {comment.users?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-ink-secondary">
                        {comment.users?.username}
                      </span>
                      <span className="text-xs text-ink-faint">
                        {timeAgo(comment.created_at)}
                      </span>
                      {(user?.id === comment.user_id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-400 ml-auto"
                        >
                          delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-ink leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {session && (
              <div className="flex gap-2 border-t border-paper-muted pt-3">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={2}
                  maxLength={280}
                  placeholder="leave a comment..."
                  className="flex-1 bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-amber-mid placeholder:text-ink-faint"
                />
                <button
                  onClick={handleComment}
                  disabled={posting || !newComment.trim()}
                  className="text-xs text-amber-warm font-medium self-end pb-2 disabled:opacity-40"
                >
                  {posting ? '...' : 'post'}
                </button>
              </div>
            )}

            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </Layout>
  )
}