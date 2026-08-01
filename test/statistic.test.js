import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import Statistic from '../src/tracker/statistic.js';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/** Fixed clock so time-window scoring is deterministic. */
const NOW = new Date('2026-06-15T12:00:00Z');

describe('Statistic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts empty', () => {
        const stat = Statistic.create();

        expect(stat.count).toBe(0);
        expect(stat.timestamps).toEqual([]);
        expect(stat.score()).toBe(0);
    });

    it('records a timestamp and bumps the count on increment', () => {
        const stat = Statistic.create();
        stat.increment();

        expect(stat.count).toBe(1);
        expect(stat.timestamps).toHaveLength(1);
    });

    it('retains only the ten most recent timestamps', () => {
        const stat = Statistic.create();

        for (let i = 0; i < 15; i++) {
            vi.setSystemTime(new Date(NOW.getTime() + i * 1000));
            stat.increment();
        }

        expect(stat.count).toBe(15);
        expect(stat.timestamps).toHaveLength(10);

        // The oldest five were dropped, so the first retained timestamp is
        // the sixth increment.
        const expectedFirst = Math.floor((NOW.getTime() + 5 * 1000) / 1000);
        expect(stat.timestamps[0]).toBe(expectedFirst);
    });

    it('awards 100 points for a selection within the last four hours', () => {
        const stat = Statistic.create();
        stat.increment();

        expect(stat.score()).toBe(100);
    });

    it('awards fewer points as a selection ages', () => {
        const at = (offsetMs) => {
            const stat = Statistic.create();
            vi.setSystemTime(new Date(NOW.getTime() - offsetMs));
            stat.increment();
            vi.setSystemTime(NOW);

            return stat.score();
        };

        expect(at(1 * HOUR)).toBe(100);
        expect(at(12 * HOUR)).toBe(80);
        expect(at(2 * DAY)).toBe(60);
        expect(at(5 * DAY)).toBe(40);
        expect(at(20 * DAY)).toBe(20);
        expect(at(60 * DAY)).toBe(10);
        expect(at(200 * DAY)).toBe(0);
    });

    it('multiplies the average window score by the lifetime count', () => {
        const stat = Statistic.create();

        // Two recent selections: average 100 points, count 2.
        stat.increment();
        stat.increment();

        expect(stat.score()).toBe(200);
    });

    it('rehydrates from persisted data', () => {
        const original = Statistic.create();
        original.increment();

        const restored = Statistic.create(JSON.parse(JSON.stringify(original)));

        expect(restored.count).toBe(1);
        expect(restored.score()).toBe(100);
    });

    it('survives malformed persisted data', () => {
        expect(() => Statistic.create({})).not.toThrow();
        expect(Statistic.create({}).score()).toBe(0);

        expect(() => Statistic.create({timestamps: 'nope', count: 'x'}))
            .not.toThrow();
        expect(Statistic.create({timestamps: 'nope', count: 'x'}).score())
            .toBe(0);

        const partial = Statistic.create({timestamps: [null, 'a'], count: 3});
        expect(partial.score()).toBe(0);
    });
});
