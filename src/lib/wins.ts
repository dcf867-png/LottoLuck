import { supabase } from './supabase'
import type { Game } from './types'

export interface CommunityWin {
  id: string
  user_id: string
  game: Game
  draw_date: string          // 'YYYY-MM-DD'
  ticket_whites: number[]    // user's 5 ticket numbers
  ticket_bonus: number       // user's bonus number
  white_matches: number      // 0–5
  bonus_match: boolean
  prize_tier: string         // e.g. '$100', 'JACKPOT'
  pick_source: 'astrology' | 'numerology' | 'statistical' | null
  display_name: string | null
  message: string | null
  created_at: string
}

export async function fetchWins(): Promise<CommunityWin[]> {
  const { data, error } = await supabase
    .from('community_wins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as CommunityWin[]
}

export async function postWin(
  win: Omit<CommunityWin, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('community_wins').insert(win)
  if (error) throw error
}

export async function deleteWin(id: string): Promise<void> {
  const { error } = await supabase.from('community_wins').delete().eq('id', id)
  if (error) throw error
}
