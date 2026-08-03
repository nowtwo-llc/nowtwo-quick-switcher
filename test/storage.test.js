import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readJson, writeJson } from '../src/storage.js';

/**
 * Swap window.localStorage for the duration of a test.
 *
 * @param {Object} descriptor - Property descriptor to install.
 * @returns {Function} Restores the original descriptor.
 */
const replaceLocalStorage = (descriptor) => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');

    Object.defineProperty(window, 'localStorage', {
        configurable: true,
        ...descriptor
    });

    return () => Object.defineProperty(window, 'localStorage', original);
};

describe('storage', () => {
    let restore = null;

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        if (restore) {
            restore();
            restore = null;
        }
    });

    describe('when storage works', () => {
        it('round-trips a value', () => {
            expect(writeJson('key', { a: 1 })).toBe(true);
            expect(readJson('key')).toEqual({ a: 1 });
        });

        it('returns null for a missing key', () => {
            expect(readJson('nothing-here')).toBeNull();
        });

        it('returns null for unparseable data instead of throwing', () => {
            localStorage.setItem('key', 'not json');

            expect(readJson('key')).toBeNull();
        });

        it('treats an empty stored value as missing', () => {
            localStorage.setItem('key', '');

            expect(readJson('key')).toBeNull();
        });

        it('reports failure when a write throws', () => {
            const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            expect(writeJson('key', { a: 1 })).toBe(false);

            setItem.mockRestore();
        });

        it('returns null when a read throws', () => {
            const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('SecurityError');
            });

            expect(readJson('key')).toBeNull();

            getItem.mockRestore();
        });
    });

    describe('when storage is unavailable', () => {
        it('degrades when localStorage is absent', () => {
            restore = replaceLocalStorage({ value: undefined });

            expect(readJson('key')).toBeNull();
            expect(writeJson('key', { a: 1 })).toBe(false);
        });

        it('degrades when accessing localStorage throws', () => {
            // Sandboxed iframes and some privacy modes throw on the property
            // access itself, before any method is called.
            restore = replaceLocalStorage({
                get() {
                    throw new Error('SecurityError: access denied');
                }
            });

            expect(() => readJson('key')).not.toThrow();
            expect(readJson('key')).toBeNull();

            expect(() => writeJson('key', { a: 1 })).not.toThrow();
            expect(writeJson('key', { a: 1 })).toBe(false);
        });

        it('degrades when a value cannot be serialized', () => {
            const circular = {};
            circular.self = circular;

            expect(writeJson('key', circular)).toBe(false);
        });
    });
});
