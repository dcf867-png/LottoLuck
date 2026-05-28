import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchPosts,
  postMessage,
  deletePost,
  fetchDisplayName,
  type CommunityPost,
} from '../lib/community'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  onAuthClick: () => void
}

export default function CommunityChat({ onAuthClick }: Props) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const nameLoaded = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPosts(await fetchPosts())
    } catch {
      setError('Failed to load chat.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user || nameLoaded.current) return
    nameLoaded.current = true
    fetchDisplayName(user.id, user.email ?? '').then(setDisplayName)
  }, [user])

  async function handlePost() {
    if (!user || !body.trim() || !displayName.trim()) return
    setPosting(true)
    setPostError('')
    try {
      await postMessage(user.id, displayName.trim(), body.trim())
      setBody('')
      await load()
    } catch {
      setPostError('Failed to post. Try again.')
    }
    setPosting(false)
  }

  async function handleDelete(id: string) {
    try {
      await deletePost(id)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-3">
        💬 Community Chat
      </p>

      {/* Compose */}
      {user ? (
        <div className="flex flex-col gap-2 mb-4 bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider shrink-0">As:</span>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name (required)"
              maxLength={40}
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none border-b border-white/10 pb-0.5"
            />
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 280))}
            placeholder="Say something to the community…"
            rows={2}
            className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">{280 - body.length} chars left</span>
            <button
              onClick={handlePost}
              disabled={posting || !body.trim() || !displayName.trim()}
              className="text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-semibold px-3 py-1 rounded-full transition-colors"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
          {postError && <p className="text-xs text-red-400">{postError}</p>}
        </div>
      ) : (
        <div className="mb-4 text-center py-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-gray-500 mb-2">Sign in to join the chat</p>
          <button
            onClick={onAuthClick}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Feed */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {loading && (
          <p className="text-center text-gray-500 text-xs py-4">Loading…</p>
        )}
        {!loading && error && (
          <div className="text-center py-4">
            <p className="text-red-400 text-xs mb-1">{error}</p>
            <button onClick={load} className="text-xs text-gray-500 underline hover:text-white">Retry</button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <p className="text-center text-gray-600 text-xs py-6">
            No messages yet — be the first!
          </p>
        )}
        {!loading && !error && posts.map(post => (
          <div
            key={post.id}
            className="bg-black/20 rounded-lg px-3 py-2 border border-white/5 flex flex-col gap-1"
          >
            <p className="text-sm text-gray-100 break-words">{post.body}</p>
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span className="font-semibold text-gray-400">{post.display_name}</span>
              <div className="flex items-center gap-2">
                <span>{timeAgo(post.created_at)}</span>
                {user?.id === post.user_id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
