import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Tracker from '../src/tracker.js';
import factories from '../src/factories.js';

const NOW = new Date('2026-06-15T12:00:00Z');

/**
 * Build an initialized Tracker.
 *
 * @param {string} name - Tracker name.
 * @returns {Object} The tracker.
 */
const createTracker = (name) => {
    const tracker = Object.create(Tracker);
    tracker.init(name);

    return tracker;
};

describe('Tracker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        localStorage.clear();
        factories.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('namespaces its storage key by tracker name', () => {
        const tracker = createTracker('main');

        expect(tracker.localStorageName).toBe('qswitcher-tracker-main');
    });

    it('ranks a previously selected item above an unselected one', () => {
        const tracker = createTracker('main');
        const apple = { text: 'Apple', trackerId: 'apple' };
        const banana = { text: 'Banana', trackerId: 'banana' };

        tracker.trackSelection(banana, 'fruit');

        expect(tracker.sort([apple, banana], 'fruit')).toEqual([banana, apple]);
    });

    it('preserves the original order when nothing is tracked', () => {
        const tracker = createTracker('main');
        const items = [{ trackerId: 'a' }, { trackerId: 'b' }, { trackerId: 'c' }];

        expect(tracker.sort(items, '')).toEqual(items);
    });

    it('honors trackerStaticSort ahead of usage score', () => {
        const tracker = createTracker('main');
        const pinned = { trackerId: 'pinned', trackerStaticSort: -1 };
        const popular = { trackerId: 'popular' };

        tracker.trackSelection(popular, 'x');

        expect(tracker.sort([popular, pinned], 'x')).toEqual([pinned, popular]);
    });

    it("does not mutate the caller's array or items", () => {
        const tracker = createTracker('main');
        const apple = { text: 'Apple', trackerId: 'apple' };
        const banana = { text: 'Banana', trackerId: 'banana' };
        const items = [apple, banana];

        tracker.trackSelection(banana, 'fruit');
        const sorted = tracker.sort(items, 'fruit');

        expect(items).toEqual([apple, banana]);
        expect(sorted).not.toBe(items);
        expect(Object.keys(apple)).toEqual(['text', 'trackerId']);
        expect(apple._qswitcher).toBeUndefined();
    });

    it('ignores items without a trackerId', () => {
        const tracker = createTracker('main');

        expect(() => tracker.trackSelection({ text: 'no id' }, 'x')).not.toThrow();
        expect(tracker.scoreSelection({ text: 'no id' }, 'x')).toBe(0);
        expect(tracker.scoreSelection('a plain string', 'x')).toBe(0);
    });

    it('persists selections across instances', () => {
        const first = createTracker('main');
        first.trackSelection({ trackerId: 'apple' }, 'fruit');

        const second = createTracker('main');

        expect(second.scoreSelection({ trackerId: 'apple' }, 'fruit')).toBe(100);
    });

    it('keeps separate trackers isolated', () => {
        const main = createTracker('main');
        main.trackSelection({ trackerId: 'apple' }, 'fruit');

        const other = createTracker('other');

        expect(other.scoreSelection({ trackerId: 'apple' }, 'fruit')).toBe(0);
    });

    it('starts fresh when stored data is corrupt', () => {
        localStorage.setItem('qswitcher-tracker-main', '{not valid json');

        let tracker;
        expect(() => {
            tracker = createTracker('main');
        }).not.toThrow();

        expect(tracker.selections).toEqual({});
    });

    it('keeps working when localStorage writes throw', () => {
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        const tracker = createTracker('main');

        expect(() => tracker.trackSelection({ trackerId: 'a' }, 'x')).not.toThrow();
        expect(tracker.scoreSelection({ trackerId: 'a' }, 'x')).toBe(100);

        setItem.mockRestore();
    });

    it('forgets everything on reset', () => {
        const tracker = createTracker('main');
        tracker.trackSelection({ trackerId: 'apple' }, 'fruit');
        tracker.reset();

        expect(tracker.scoreSelection({ trackerId: 'apple' }, 'fruit')).toBe(0);
        expect(createTracker('main').selections).toEqual({});
    });
});

describe('factories', () => {
    beforeEach(() => {
        localStorage.clear();
        factories.clear();
    });

    it('returns the same tracker for the same name', () => {
        expect(factories.tracker('main')).toBe(factories.tracker('main'));
    });

    it('returns different trackers for different names', () => {
        expect(factories.tracker('main')).not.toBe(factories.tracker('other'));
    });
});
