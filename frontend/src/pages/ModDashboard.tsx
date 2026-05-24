import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface Report {
  id: string
  reason: string
  status: string
  created_at: string
  reporter: { username: string }
  reported_user: { username: string } | null
  reported_ku: { line1: string, line2: string, line3: string } | null
  reported_comment: { content: string } | null
}

export default function ModDashboard() {
  const { session } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'reviewed' | 'dismissed'>('pending')

  const fetchReports = async (status: string) => {
    if (!session) return
    setLoading(true)
    try {
      const data = await api(`/reports?status=${status}`, {}, session.access_token)
      setReports(data.reports)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(tab)
  }, [tab, session])

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!session) return
    try {
      await api(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }, session.access_token)
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Layout>
      <TopBar title="mod dashboard" showBack />

      <div className="flex border-b border-paper-border bg-paper-nav">
        {(['pending', 'reviewed', 'dismissed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium ${
              tab === t
                ? 'text-amber-warm border-b border-amber-warm'
                : 'text-ink-faint'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && reports.length === 0 && (
          <p className="text-center text-ink-muted text-sm py-8">no {tab} reports</p>
        )}

        {reports.map(report => (
          <div key={report.id} className="bg-paper-card border border-paper-border rounded-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-faint">reported by {report.reporter?.username}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                report.status === 'pending'
                  ? 'bg-amber-light text-amber-mid'
                  : report.status === 'reviewed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-paper-muted text-ink-faint'
              }`}>
                {report.status}
              </span>
            </div>

            {report.reported_user && (
              <div className="bg-paper-bg border border-paper-border rounded-lg p-3">
                <p className="text-xs text-ink-muted mb-1">reported user</p>
                <p className="text-sm text-ink">@{report.reported_user.username}</p>
              </div>
            )}

            {report.reported_ku && (
              <div className="bg-paper-bg border border-paper-border rounded-lg p-3">
                <p className="text-xs text-ink-muted mb-1">reported ku</p>
                <p className="text-sm text-ink leading-relaxed">
                  {report.reported_ku.line1}<br />
                  {report.reported_ku.line2}<br />
                  {report.reported_ku.line3}
                </p>
              </div>
            )}

            {report.reported_comment && (
              <div className="bg-paper-bg border border-paper-border rounded-lg p-3">
                <p className="text-xs text-ink-muted mb-1">reported comment</p>
                <p className="text-sm text-ink">{report.reported_comment.content}</p>
              </div>
            )}

            <div className="bg-paper-bg border border-paper-border rounded-lg p-3">
              <p className="text-xs text-ink-muted mb-1">reason</p>
              <p className="text-sm text-ink">{report.reason}</p>
            </div>

            {tab === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                  className="flex-1 bg-amber-warm text-paper-card rounded-lg py-2 text-xs font-medium"
                >
                  mark reviewed
                </button>
                <button
                  onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                  className="flex-1 border border-paper-border text-ink-muted rounded-lg py-2 text-xs"
                >
                  dismiss
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}