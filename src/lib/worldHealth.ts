import { supabase } from './supabase';
import { analyzeEntry } from './gemini';
import type { EntryImpact } from './gemini';
import type { JournalEntry } from './types';

export interface WorldState {
  score: number;
  effect: EntryImpact['world_effect'] | null;
  effectType: EntryImpact['impact_type'] | null;
}

export async function fetchWorldHealth(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 50;

  const { data } = await supabase
    .from('world_health')
    .select('score')
    .eq('user_id', user.id)
    .single();

  return data?.score ?? 50;
}

export async function initWorldHealth(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 50;

  const { data } = await supabase
    .from('world_health')
    .select('score')
    .eq('user_id', user.id)
    .single();

  if (data) return data.score;

  const { data: inserted } = await supabase
    .from('world_health')
    .insert({ user_id: user.id, score: 50 })
    .select('score')
    .single();

  return inserted?.score ?? 50;
}

export function applyImpact(impact: EntryImpact, currentScore: number): WorldState {
  const delta = impact.impact_score * 0.8;
  let newScore = currentScore + delta;
  newScore = Math.max(0, Math.min(100, Math.round(newScore)));

  return {
    score: newScore,
    effect: impact.world_effect,
    effectType: impact.impact_type,
  };
}

export function recalculateFromEntries(entries: JournalEntry[]): number {
  let score = 50;
  for (const entry of entries) {
    const impact = analyzeEntry(entry.category, entry.mood);
    const delta = impact.impact_score * 0.8;
    score += delta;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function saveWorldHealth(score: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  console.log('[WorldHealth] Saving score:', score, 'for user:', user.id);
  const { error } = await supabase
    .from('world_health')
    .upsert({ user_id: user.id, score, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) {
    console.error('[WorldHealth] Save error:', error);
  } else {
    console.log('[WorldHealth] Save successful');
  }
}
