import { describe, it, expect } from 'vitest';
import { analyzeEntry } from './gemini';

describe('analyzeEntry', () => {
    it('scores a concerned mood as negative regardless of category', () => {
        const result = analyzeEntry('lifestyle', 'concerned');
        expect(result.impact_type).toBe('negative');
        expect(result.impact_score).toBeLessThan(0);
    });

    it('scores a proud mood on a positive category as exceptional when high enough', () => {
        const result = analyzeEntry('water', 'proud');
        expect(result.impact_type).toBe('positive');
        expect(result.is_exceptional).toBe(true);
        expect(result.world_effect).toBe('flowers');
    });

    it('halves the score for a neutral mood', () => {
        const result = analyzeEntry('transport', 'neutral');
        expect(result.impact_score).toBe(2); // category score 4 / 2
    });

    it('treats a waste entry with no mood as negative (base category effect)', () => {
        const result = analyzeEntry('waste', null);
        expect(result.impact_type).toBe('negative');
    });
});