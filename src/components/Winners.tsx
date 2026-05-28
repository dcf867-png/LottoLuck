import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Draw } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'
import { prizeTier, loadSavedPicks, matchPickAgainstDraws, type DrawResult } from '../lib/trackRecord'
import type { SavedPick } from '../lib/types'
import { fetchWins, postWin, deleteWin, type CommunityWin } from '../lib/wins'
import {
  fetchComments,
  postComment,
  deleteComment,
  fetchDisplayName,
  type CommunityComment,
} from '../lib/community'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import CommunityChat from './CommunityChat'

interface Props {
  pbDraws: Draw[]
  mmDraws: Draw[]
  onAuthClick: () => void
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetectedWin {
  pick: SavedPick
  draw: Draw
  whiteMatches: number
  bonusMatch: boolean
  tier: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDrawDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function timeAgo(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function getDetectedWins(pbDraws: Draw[], mmDraws: Draw[]): DetectedWin[] {
  const picks = loadSavedPicks()
  const result: DetectedWin[] = []
  for (const pick of picks) {
    const draws = pick.game === 'powerball' ? pbDraws : mmDraws
    const drawResults: DrawResult[] = matchPickAgainstDraws(pick, draws)
    for (const r of drawResults) {
      const tier = prizeTier(pick.game, r.whiteMatches, r.bonusMatch)
      if (tier) {
        result.push({ pick, draw: r.draw, whiteMatches: r.whiteMatches, bonusMatch: r.bonusMatch, tier })
      }
    }
  }
  return result.sort((a, b) => b.draw.date.localeCompare(a.draw.date))
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: SavedPick['source'] | null }) {
  if (!source) return null
  const map = {
    astrology:   { label: '★ Astro', cls: 'bg-purple-800 text-purple-200' },
    numerology:  { label: '# Num',   cls: 'bg-blue-800 text-blue-200' },
    statistical: { label: '📊 Stat', cls: 'bg-emerald-800 text-emerald-200' },
  }
  const { label, cls } = map[source]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ─── Win comments ─────────────────────────────────────────────────────────────

function WinComments({
  winId,
  currentUserId,
  userDisplayName,
  onAuthClick,
}: {
  winId: string
  currentUserId: string | undefined
  userDisplayName: string
  onAuthClick: () => void
}) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setComments(await fetchComments(winId))
    } catch { /* silent */ }
    setLoading(false)
  }, [winId])

  useEffect(() => { load() }, [load])

  async function handlePost() {
    if (!currentUserId || !body.trim() || !userDisplayName.trim()) return
    setPosting(true)
    setPostError('')
    try {
      await postComment(winId, currentUserId, userDisplayName, body.trim())
      setBody('')
      await load()
    } catch {
      setPostError('Failed to post. Try again.')
    }
    setPosting(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div className="border-t border-white/10 pt-2 flex flex-col gap-2">
      {loading && <p className="text-[10px] text-gray-600">Loading comments…</p>}

      {!loading && comments.length === 0 && (
        <p className="text-[10px] text-gray-600 italic">No comments yet.</p>
      )}

      {!loading && comments.map(c => (
        <div key={c.id} className="flex flex-col gap-0.5 bg-white/5 rounded-lg px-2.5 py-1.5">
          <p className="text-xs text-gray-200 break-words">{c.body}</p>
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span className="font-semibold text-gray-400">{c.display_name}</span>
            <div className="flex items-center gap-2">
              <span>{timeAgo(c.created_at)}</span>
              {currentUserId === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
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

      {currentUserId ? (
        <div className="flex gap-2 items-end mt-1">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 280))}
            placeholder="Add a comment…"
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
          />
          <button
            onClick={handlePost}
            disabled={posting || !body.trim()}
            className="text-[11px] bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            {posting ? '…' : 'Reply'}
          </button>
        </div>
      ) : (
        <button
          onClick={onAuthClick}
          className="text-[11px] text-purple-400 hover:text-purple-300 text-left transition-colors"
        >
          Sign in to comment →
        </button>
      )}
      {postError && <p className="text-[10px] text-red-400">{postError}</p>}
    </div>
  )
}

// ─── Quick post form (pre-filled from Track Record win) ───────────────────────

function QuickPostForm({
  detected,
  userId,
  onPosted,
  onCancel,
}: {
  detected: DetectedWin
  userId: string
  onPosted: () => void
  onCancel: () => void
}) {
  const { pick, draw, whiteMatches, bonusMatch, tier } = detected
  const cfg = GAME_CONFIG[pick.game]
  const [displayName, setDisplayName] = useState('')
  const [pickSource, setPickSource] = useState<SavedPick['source']>(pick.source)
  const [message, setMessage] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.full_name) setDisplayName(profile.full_name)
          else setDisplayName(data.user!.email?.split('@')[0] ?? '')
        })
    })
  }, [])

  async function handlePost() {
    setPosting(true)
    setPostError('')
    try {
      await postWin({
        user_id: userId,
        game: pick.game,
        draw_date: draw.date,
        ticket_whites: pick.whites,
        ticket_bonus: pick.bonus,
        white_matches: whiteMatches,
        bonus_match: bonusMatch,
        prize_tier: tier,
        pick_source: pickSource,
        display_name: displayName.trim() || null,
        message: message.trim() || null,
      })
      onPosted()
    } catch {
      setPostError('Failed to post. Please try again.')
      setPosting(false)
    }
  }

  const isJackpot = tier === 'JACKPOT'

  return (
    <div className="bg-black/30 rounded-xl p-4 flex flex-col gap-3 border border-green-800/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-green-400">Share this win with the community</p>
        <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs">Cancel</button>
      </div>

      <div className={`rounded-lg px-3 py-2 text-center ${isJackpot ? 'bg-yellow-900/30 border border-yellow-700/40' : 'bg-green-950/30 border border-green-800/40'}`}>
        <p className={`font-bold text-sm ${isJackpot ? 'text-yellow-400' : 'text-green-400'}`}>
          {isJackpot ? '🏆 JACKPOT' : `🎉 ${tier}`}
        </p>
        <p className="text-xs text-gray-300 mt-0.5">
          {whiteMatches} white{whiteMatches !== 1 ? 's' : ''}{bonusMatch ? ` + ${cfg.bonusLabel}` : ''} · {formatDrawDate(draw.date)}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Display Name</label>
        <input
          type="text"
          placeholder="How should we show your name?"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">
          Pick Source <span className="text-gray-600 normal-case">(optional)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['astrology', 'numerology', 'statistical'] as const).map(src => (
            <button
              key={src}
              onClick={() => setPickSource(src)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                pickSource === src
                  ? src === 'astrology' ? 'bg-purple-700 text-purple-100'
                  : src === 'numerology' ? 'bg-blue-700 text-blue-100'
                  : 'bg-emerald-700 text-emerald-100'
                  : 'bg-white/10 text-gray-400 hover:bg-white/15'
              }`}
            >
              {src === 'astrology' ? '★ Astro' : src === 'numerology' ? '# Num' : '📊 Stat'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">
          Message <span className="text-gray-600 normal-case">(optional · {280 - message.length} chars left)</span>
        </label>
        <textarea
          placeholder="Share the excitement…"
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 280))}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-green-500 shrink-0"
        />
        <span className="text-xs text-gray-300">
          I confirm I actually purchased this ticket and am reporting an honest win.
        </span>
      </label>

      {postError && <p className="text-xs text-red-400 text-center">{postError}</p>}

      <button
        onClick={handlePost}
        disabled={posting || !confirmed}
        className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-2 rounded-lg text-sm transition-colors"
      >
        {posting ? 'Posting…' : '🏆 Share My Win!'}
      </button>
    </div>
  )
}

// ─── Detected win card ────────────────────────────────────────────────────────

function DetectedWinCard({
  detected,
  alreadyPosted,
  userId,
  onPosted,
}: {
  detected: DetectedWin
  alreadyPosted: boolean
  userId: string
  onPosted: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const { pick, draw, whiteMatches, bonusMatch, tier } = detected
  const cfg = GAME_CONFIG[pick.game]
  const isJackpot = tier === 'JACKPOT'

  return (
    <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            pick.game === 'powerball' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
          }`}>
            {cfg.label}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isJackpot
              ? pick.game === 'powerball' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'
              : 'bg-green-800 text-green-200'
          }`}>
            {isJackpot ? '🏆 JACKPOT' : `🎉 ${tier}`}
          </span>
          <SourceBadge source={pick.source} />
        </div>
        {alreadyPosted ? (
          <span className="text-[10px] text-teal-400 font-semibold">✓ Shared</span>
        ) : (
          !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[11px] bg-green-800/60 hover:bg-green-700/70 text-green-300 font-semibold px-2.5 py-1 rounded-full transition-colors"
            >
              Post to Community
            </button>
          )
        )}
      </div>

      <p className="text-xs text-gray-300">
        <span className="font-semibold text-white">
          {whiteMatches} white{whiteMatches !== 1 ? 's' : ''}
          {bonusMatch ? ` + ${cfg.bonusLabel}` : ''}
        </span>
        {' '}on {formatDrawDate(draw.date)}
      </p>

      <div className="flex flex-wrap gap-1 items-center">
        {draw.whites.map((w, i) => (
          <span
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              pick.whites.includes(w) ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {w}
          </span>
        ))}
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ml-0.5 ${
          bonusMatch ? cfg.bonusColor + ' text-white' : 'bg-gray-700 text-gray-400'
        }`}>
          {draw.bonus}
        </span>
        <span className="text-[10px] text-gray-500 ml-1">green = your match</span>
      </div>

      {showForm && (
        <div className="mt-1">
          <QuickPostForm
            detected={detected}
            userId={userId}
            onPosted={() => { setShowForm(false); onPosted() }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Community win card ───────────────────────────────────────────────────────

function WinCard({
  win,
  draws,
  currentUserId,
  userDisplayName,
  onDelete,
  onAuthClick,
}: {
  win: CommunityWin
  draws: { pb: Draw[]; mm: Draw[] }
  currentUserId: string | undefined
  userDisplayName: string
  onDelete: (id: string) => void
  onAuthClick: () => void
}) {
  const cfg = GAME_CONFIG[win.game]
  const isJackpot = win.prize_tier === 'JACKPOT'
  const isOwner = currentUserId === win.user_id
  const allDraws = win.game === 'powerball' ? draws.pb : draws.mm
  const draw = allDraws.find(d => d.date === win.draw_date)
  const [showComments, setShowComments] = useState(false)

  return (
    <div className="bg-black/25 rounded-xl p-4 flex flex-col gap-3 border border-white/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            win.game === 'powerball' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
          }`}>
            {cfg.label}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isJackpot
              ? win.game === 'powerball' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'
              : 'bg-green-800 text-green-200'
          }`}>
            {isJackpot ? '🏆 JACKPOT' : `🎉 ${win.prize_tier}`}
          </span>
          <SourceBadge source={win.pick_source} />
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(win.id)}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors shrink-0"
            title="Delete post"
          >
            ✕
          </button>
        )}
      </div>

      <div className="text-xs text-gray-300">
        <span className="font-semibold text-white">
          {win.white_matches} white{win.white_matches !== 1 ? 's' : ''}
          {win.bonus_match ? ` + ${cfg.bonusLabel}` : ''}
        </span>
        {' '}on {formatDrawDate(win.draw_date)}
      </div>

      {draw && (
        <div className="flex flex-wrap gap-1 items-center">
          {draw.whites.map((w, i) => (
            <span
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                win.ticket_whites.includes(w) ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {w}
            </span>
          ))}
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ml-0.5 ${
            win.bonus_match ? cfg.bonusColor + ' text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            {draw.bonus}
          </span>
          <span className="text-[10px] text-gray-500 ml-1">(draw · green = match)</span>
        </div>
      )}

      {win.message && (
        <p className="text-xs text-gray-300 italic">"{win.message}"</p>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>{win.display_name ?? 'Anonymous'}</span>
        <div className="flex items-center gap-3">
          <span>{timeAgo(win.created_at)}</span>
          <button
            onClick={() => setShowComments(v => !v)}
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            {showComments ? '▲ Hide' : '💬 Comments'}
          </button>
        </div>
      </div>

      {showComments && (
        <WinComments
          winId={win.id}
          currentUserId={currentUserId}
          userDisplayName={userDisplayName}
          onAuthClick={onAuthClick}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Winners({ pbDraws, mmDraws, onAuthClick }: Props) {
  const { user } = useAuth()
  const [wins, setWins] = useState<CommunityWin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userDisplayName, setUserDisplayName] = useState('')
  const nameLoaded = useRef(false)

  const loadWins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchWins()
      setWins(data)
    } catch {
      setError('Failed to load wins. Check your connection.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadWins() }, [loadWins])

  useEffect(() => {
    if (!user || nameLoaded.current) return
    nameLoaded.current = true
    fetchDisplayName(user.id, user.email ?? '').then(setUserDisplayName)
  }, [user])

  const detectedWins = useMemo(
    () => (user ? getDetectedWins(pbDraws, mmDraws) : []),
    [user, pbDraws, mmDraws]
  )

  function isAlreadyPosted(detected: DetectedWin): boolean {
    return wins.some(w =>
      w.user_id === user?.id &&
      w.game === detected.pick.game &&
      w.draw_date === detected.draw.date &&
      detected.pick.whites.every(n => w.ticket_whites.includes(n)) &&
      detected.pick.bonus === w.ticket_bonus
    )
  }

  async function handleDelete(id: string) {
    try {
      await deleteWin(id)
      setWins(prev => prev.filter(w => w.id !== id))
    } catch { /* silently ignore */ }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Your detected wins — full width above the columns */}
      {user && detectedWins.length > 0 && (
        <section className="panel">
          <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-2">
            🎯 Your Wins Detected
          </p>
          <div className="flex flex-col gap-2">
            {detectedWins.map((d) => (
              <DetectedWinCard
                key={`${d.pick.id}-${d.draw.date}`}
                detected={d}
                alreadyPosted={isAlreadyPosted(d)}
                userId={user.id}
                onPosted={loadWins}
              />
            ))}
          </div>
        </section>
      )}

      {/* Side-by-side: Chat | Wins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

        {/* Left — Community Chat */}
        <section className="panel">
          <CommunityChat onAuthClick={onAuthClick} />
        </section>

        {/* Right — Community Wins */}
        <section className="panel flex flex-col gap-3">
          <div>
            <h3 className="panel-title text-amber-400 mb-0.5">
              <span className="dot" />🏆 Community Wins
            </h3>
            <p className="text-[10px] text-gray-500">
              Picks verified in Track Record · ticket purchase self-reported
            </p>
          </div>

          {!user && (
            <div className="text-center py-2">
              <p className="text-xs text-gray-500 mb-2">Sign in to see if your saved picks hit!</p>
              <button
                onClick={onAuthClick}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">Loading wins…</div>
          )}
          {!loading && error && (
            <div className="text-center py-6">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button onClick={loadWins} className="text-xs text-gray-400 hover:text-white underline">Retry</button>
            </div>
          )}
          {!loading && !error && wins.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No wins posted yet.
              <br />
              <span className="text-xs text-gray-600">Be the first to share a win!</span>
            </div>
          )}
          {!loading && !error && wins.length > 0 && (
            <div className="flex flex-col gap-3">
              {wins.map(win => (
                <WinCard
                  key={win.id}
                  win={win}
                  draws={{ pb: pbDraws, mm: mmDraws }}
                  currentUserId={user?.id}
                  userDisplayName={userDisplayName}
                  onDelete={handleDelete}
                  onAuthClick={onAuthClick}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
