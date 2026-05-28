import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchPosts,
  postMessage,
  deletePost,
  fetchUsername,
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
  const [username, setUsername] = useState<string | null | 'loading'>('loading')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const userLoaded = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPosts(await fetchPosts())
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as Record<string, unknown>)?.message
            ? String((err as Record<string, unknown>).message)
            : JSON.stringify(err)
      console.error('fetchPosts error:', msg, err)
      setError(msg)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user || userLoaded.current) return
    userLoaded.current = true
    fetchUsername(user.id).then(setUsername)
  }, [user])

  // Reset when user signs out
  useEffect(() => {
    if (!user) {
      userLoaded.current = false
      setUsername('loading')
    }
  }, [user])

  async function handlePost() {
    if (!user || !body.trim() || typeof username !== 'string' || !username) return
    setPosting(true)
    setPostError('')
    try {
      await postMessage(user.id, username, body.trim())
      setBody('')
      await load()
    } catch {
      setPostError('Failed to post. Try again.')
    }
    setPosting(false)
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-3">
        💬 Community Chat
      </p>

      {/* Compose area */}
      {!user ? (
        <div className="mb-4 text-center py-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-gray-500 mb-2">Sign in to join the chat</p>
          <button
            onClick={onAuthClick}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            Sign in
          </button>
        </div>
      ) : username === 'loading' ? null : username === null ? (
        <div className="mb-4 px-3 py-3 bg-amber-900/20 border border-amber-700/40 rounded-xl text-center">
          <p className="text-xs text-amber-300 font-semibold mb-1">Username required to post</p>
          <p className="text-[11px] text-gray-400">Set one in the <span className="text-amber-300 font-semibold">Profile</span> tab to join the conversation.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-4 bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">Posting as</span>
            <span className="text-[11px] font-semibold text-purple-300">@{username}</span>
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
              disabled={posting || !body.trim()}
              className="text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-semibold px-3 py-1 rounded-full transition-colors"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
          {postError && <p className="text-xs text-red-400">{postError}</p>}
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
              <span className="font-semibold text-purple-300">@{post.display_name}</span>
              <div className="flex items-center gap-2">
                <span>{timeAgo(post.created_at)}</span>
                {user?.id === post.user_id && (
                  <button
                    onClick={() => deletePost(post.id).then(() => setPosts(prev => prev.filter(p => p.id !== post.id)))}
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
