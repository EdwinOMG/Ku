import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import TopBar from '../components/layout/TopBar'
import SketchCanvas from '../components/ku/SketchCanvas'

const MAX_WORDS = [5, 7, 5]

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

export default function Compose() {
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const [lines, setLines] = useState(['', '', ''])
  const [hashtags, setHashtags] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLineChange = (index: number, value: string) => {
    const wordCount = countWords(value)
    if (wordCount > MAX_WORDS[index]) return
    const updated = [...lines]
    updated[index] = value
    setLines(updated)
  }

 const uploadSketch = async (): Promise<string | null> => {
  if (!sketchDataUrl || !user) {
    console.log('no sketch data or user', { sketchDataUrl, user })
    return null
  }
  const blob = dataURLtoBlob(sketchDataUrl)
  const fileName = `${user.id}/${Date.now()}.png`
  console.log('uploading sketch:', fileName)
  const { error, data } = await supabase.storage
    .from('sketches')
    .upload(fileName, blob, { contentType: 'image/png', upsert: false })
  console.log('upload result:', { error, data })
  if (error) return null
  const { data: urlData } = supabase.storage.from('sketches').getPublicUrl(fileName)
  console.log('public url:', urlData.publicUrl)
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
          sketch_url: sketchUrl
        })
      }, session.access_token)

      navigate('/home')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper-bg max-w-lg mx-auto">
      <TopBar
        title="write a ku"
        showBack
        right={
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm text-amber-warm font-medium disabled:opacity-40"
          >
            {loading ? 'posting...' : 'post'}
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-paper-card border border-paper-border rounded-card p-5">
          <p className="text-xs text-ink-faint mb-4 text-center">5 · 7 · 5 words per line</p>

          {lines.map((line, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-ink-faint">line {i + 1}</span>
                <span className={`text-xs ${
                  countWords(line) === MAX_WORDS[i]
                    ? 'text-amber-warm'
                    : 'text-ink-faint'
                }`}>
                  {countWords(line)}/{MAX_WORDS[i]}
                </span>
              </div>
              <textarea
                value={line}
                onChange={e => handleLineChange(i, e.target.value)}
                rows={2}
                placeholder={
                  i === 0 ? 'five words here...' :
                  i === 1 ? 'seven words in the middle...' :
                  'five words to close...'
                }
                className="w-full bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-amber-mid placeholder:text-ink-faint"
              />
            </div>
          ))}
        </div>

        <div className="bg-paper-card border border-paper-border rounded-card p-4">
          <SketchCanvas onChange={setSketchDataUrl} />
        </div>

        <div className="bg-paper-card border border-paper-border rounded-card p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-secondary">hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#nature #morning"
              className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid placeholder:text-ink-faint"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-secondary">visibility</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
            >
              <option value="public">public</option>
              <option value="friends">friends only</option>
              <option value="private">private</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}
      </div>
    </div>
  )
}