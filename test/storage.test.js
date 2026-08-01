import {beforeEach, describe, expect, it, vi} from 'vitest';

import {readJson, writeJson} from '../src/storage.js';

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('round-trips a value', () => {
        expect(writeJson('key', {a: 1})).toBe(true);
        expect(readJson('key')).toEqual({a: 1});
    });

    it('returns null for a missing key', () => {
        expect(readJson('nothing-here')).toBeNull();
    });

    it('returns null for unparseable data instead of throwing', () => {
        localStorage.setItem('key', 'not json');

        expect(readJson('key')).toBeNull();
    });

    it('reports failure when a write throws', () => {
        const setItem = vi.spyOn(Storage.prototype, 'setItem')
            .mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

        expect(writeJson('key', {a: 1})).toBe(false);

        setItem.mockRestore();
    });

    it('returns null when a read throws', () => {
        const getItem = vi.spyOn(Storage.prototype, 'getItem')
            .mockImplementation(() => {
                throw new Error('SecurityError');
            });

        expect(readJson('key')).toBeNull();

        getItem.mockRestore();
    });
});
