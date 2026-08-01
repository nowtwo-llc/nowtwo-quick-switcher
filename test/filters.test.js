import {describe, expect, it} from 'vitest';

import filters from '../src/filters.js';

describe('filters.isMatch', () => {
    it('finds a simple substring', () => {
        expect(filters.isMatch('world', 'hello world and friends')).toBe(true);
    });

    it('matches multi-word criteria in any order', () => {
        expect(filters.isMatch('friends world', 'hello world and friends'))
            .toBe(true);
    });

    it('requires every search word to be present', () => {
        expect(filters.isMatch('world friends the', 'hello world and friends'))
            .toBe(false);
    });

    it('matches regardless of case', () => {
        expect(filters.isMatch('WORLD', 'hello world')).toBe(true);
        expect(filters.isMatch('world', 'HELLO WORLD')).toBe(true);
        expect(filters.isMatch('HeLLo WoRLD', 'hello world')).toBe(true);
    });

    it('treats an empty search as matching everything', () => {
        expect(filters.isMatch('', 'anything at all')).toBe(true);
    });

    it('does not throw on punctuation-only search terms', () => {
        expect(() => filters.isMatch('!!!', 'hello world')).not.toThrow();
        expect(filters.isMatch('!!!', 'hello world')).toBe(false);
    });

    it('still matches punctuation present in the haystack', () => {
        expect(filters.isMatch('!!!', 'wow!!! amazing')).toBe(true);
    });

    it('handles null and undefined haystacks without throwing', () => {
        expect(filters.isMatch('word', null)).toBe(false);
        expect(filters.isMatch('word', undefined)).toBe(false);
    });

    it('coerces non-string haystacks', () => {
        expect(filters.isMatch('42', 42)).toBe(true);
    });

    it('tokenizes non-ascii words', () => {
        expect(filters.isMatch('café', 'le café noir')).toBe(true);
        expect(filters.isMatch('CAFÉ', 'le café noir')).toBe(true);
    });
});

describe('filters.areWordsFound', () => {
    it('returns true when every word appears', () => {
        expect(filters.areWordsFound('a b', 'a and b')).toBe(true);
    });

    it('returns false when a word is missing', () => {
        expect(filters.areWordsFound('a z', 'a and b')).toBe(false);
    });

    it('returns false when the needle has no searchable words', () => {
        expect(filters.areWordsFound('---', 'a and b')).toBe(false);
    });
});
