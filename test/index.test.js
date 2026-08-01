import {afterEach, describe, expect, it} from 'vitest';

import lstrQuickSwitcher from '../src/index.js';

describe('package entry point', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('default-exports a callable factory', () => {
        expect(typeof lstrQuickSwitcher).toBe('function');
    });

    it('exposes the documented public API', () => {
        const switcher = lstrQuickSwitcher({searchDelay: 0});

        expect(Object.keys(switcher).sort())
            .toEqual(['close', 'destroy', 'isOpen', 'open', 'toggle']);

        switcher.destroy();
    });

    it('hangs filters and sorters off the factory', () => {
        expect(typeof lstrQuickSwitcher.filters.isMatch).toBe('function');
        expect(typeof lstrQuickSwitcher.filters.areWordsFound).toBe('function');
        expect(typeof lstrQuickSwitcher.sorters.tracker).toBe('function');
    });

    it('works with no options at all', () => {
        expect(() => {
            const switcher = lstrQuickSwitcher();
            switcher.destroy();
        }).not.toThrow();
    });
});
