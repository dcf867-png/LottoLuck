import { supabase } from './supabase'

export interface CommunityPost {
  id: string
  user_id: string
  display_name: string
  body: string
  created_at: string
}

export interface CommunityComment {
  id: string
  win_id: string
  user_id: string
  display_name: string
  body: string
  created_at: string
}

// ─── Profile helper ───────────────────────────────────────────────────────────

export async function fetchUsername(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()
  return data?.username ?? null
}

// ─── Community posts (general chat) ──────────────────────────────────────────

export async function fetchPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as CommunityPost[]
}

export async function postMessage(
  userId: string,
  displayName: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from('community_posts').insert({
    user_id: userId,
    display_name: displayName,
    body,
  })
  if (error) throw error
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('community_posts').delete().eq('id', id)
  if (error) throw error
}

// ─── Comments on wins ─────────────────────────────────────────────────────────

export async function fetchComments(winId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('win_id', winId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as CommunityComment[]
}

export async function postComment(
  winId: string,
  userId: string,
  displayName: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from('community_comments').insert({
    win_id: winId,
    user_id: userId,
    display_name: displayName,
    body,
  })
  if (error) throw error
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('community_comments').delete().eq('id', id)
  if (error) throw error
}
