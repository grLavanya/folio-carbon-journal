import type { Category, Mood } from './types';

export interface EntryImpact {
  impact_score: number;
  impact_type: 'positive' | 'negative' | 'neutral';
  is_exceptional: boolean;
  world_effect: 'sky' | 'trees' | 'water' | 'flowers';
}

const CATEGORY_IMPACT: Record<Category, { score: number; effect: EntryImpact['world_effect'] }> = {
  transport: { score: 4, effect: 'sky' },
  energy: { score: 3, effect: 'sky' },
  food: { score: 3, effect: 'trees' },
  waste: { score: -3, effect: 'trees' },
  water: { score: 5, effect: 'water' },
  lifestyle: { score: 4, effect: 'flowers' },
};

const MOOD_MODIFIER: Partial<Record<Mood, number>> = {
  concerned: -2,
  proud: 2,
  motivated: 1,
  hopeful: 1,
};

export function analyzeEntry(category: Category, mood: Mood | null): EntryImpact {
  const { score: catScore, effect } = CATEGORY_IMPACT[category];
  const moodMod = (mood && MOOD_MODIFIER[mood]) ?? 0;

  let totalScore: number;
  if (mood === 'concerned') {
    totalScore = -Math.abs(catScore);
  } else if (mood === 'neutral') {
    totalScore = catScore / 2;
  } else {
    // Proud, Hopeful, Motivated always positive
    totalScore = Math.abs(catScore) + moodMod;
  }

  const impactType = totalScore > 0 ? 'positive' : totalScore < 0 ? 'negative' : 'neutral';

  // Exceptional = positive category + proud mood (high-impact positive action)
  const isExceptional = totalScore >= 5;

  return {
    impact_score: totalScore,
    impact_type: impactType,
    is_exceptional: isExceptional,
    world_effect: isExceptional ? 'flowers' : effect,
  };
}
