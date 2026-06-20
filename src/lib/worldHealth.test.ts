import { describe, it, expect } from 'vitest';
import { applyImpact } from './worldHealth';
import type { EntryImpact } from './gemini';

describe('applyImpact', () => {
    it('increases score for a positive impact', () => {
        const impact: EntryImpact = {
            impact_score: 5,
            impact_type: 'positive',
            is_exceptional: false,
            world_effect: 'sky',
        };
        const result = applyImpact(impact, 50);
        expect(result.score).toBeGreaterThan(50);
    });

    it('clamps score at 100 maximum', () => {
        const impact: EntryImpact = {
            impact_score: 50,
            impact_type: 'positive',
            is_exceptional: true,
            world_effect: 'flowers',
        };
        const result = applyImpact(impact, 95);
        expect(result.score).toBe(100);
    });

    it('clamps score at 0 minimum', () => {
        const impact: EntryImpact = {
            impact_score: -50,
            impact_type: 'negative',
            is_exceptional: false,
            world_effect: 'trees',
        };
        const result = applyImpact(impact, 5);
        expect(result.score).toBe(0);
    });

    it('passes through the effect and effectType unchanged', () => {
        const impact: EntryImpact = {
            impact_score: 3,
            impact_type: 'positive',
            is_exceptional: false,
            world_effect: 'water',
        };
        const result = applyImpact(impact, 50);
        expect(result.effect).toBe('water');
        expect(result.effectType).toBe('positive');
    });
});