import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Selection from '../src/tracker/selection.js';

const NOW = new Date('2026-06-15T12:00:00Z');

/**
 * Build an initialized Selection.
 *
 * @param {Object} [data] - Optional persisted data.
 * @returns {Object} The selection.
 */
const createSelection = (data) => {
    const selection = Object.create(Selection);
    selection.init(data);

    return selection;
};

describe('Selection', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('scores zero before anything is recorded', () => {
        expect(createSelection().score('anything')).toBe(0);
    });

    it('records against both the overall and per-term statistics', () => {
        const selection = createSelection();
        selection.increment('blue');

        expect(selection.score('blue')).toBe(100);
        expect(selection.overall.count).toBe(1);
    });

    it('falls back to half the overall score for unseen search terms', () => {
        const selection = createSelection();
        selection.increment('blue');

        expect(selection.score('green')).toBe(50);
    });

    it('treats search terms case-insensitively', () => {
        const selection = createSelection();
        selection.increment('Blue');

        expect(selection.score('blue')).toBe(100);
        expect(selection.score('BLUE')).toBe(100);
    });

    it('uses the overall score when no search term is given', () => {
        const selection = createSelection();
        selection.increment('blue');

        expect(selection.score('')).toBe(50);
        expect(selection.score(undefined)).toBe(50);
    });

    it('increments only the overall statistic for an empty search term', () => {
        const selection = createSelection();
        selection.increment('');

        expect(selection.overall.count).toBe(1);
        expect(Object.keys(selection.searchKeys)).toHaveLength(0);
    });

    it('rehydrates persisted per-term statistics', () => {
        const original = createSelection();
        original.increment('blue');

        const restored = createSelection(JSON.parse(JSON.stringify(original)));

        expect(restored.score('blue')).toBe(100);
    });

    it('recovers per-term data stored under a non-canonical key', () => {
        // Data written before keys were normalized can carry mixed case; the
        // statistic must still be recovered rather than silently reset.
        const restored = createSelection({
            overall: { timestamps: [], count: 0 },
            searchKeys: {
                BLUE: {
                    timestamps: [Math.floor(NOW.getTime() / 1000)],
                    count: 1
                }
            }
        });

        expect(restored.score('blue')).toBe(100);
    });

    it('survives malformed persisted data', () => {
        expect(() => createSelection({})).not.toThrow();
        expect(() => createSelection({ searchKeys: null })).not.toThrow();
        expect(() => createSelection({ searchKeys: 'nope' })).not.toThrow();
        expect(createSelection({}).score('blue')).toBe(0);
    });
});
