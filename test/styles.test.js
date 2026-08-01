import {beforeAll, describe, expect, it} from 'vitest';
import {compile} from 'sass';
import {fileURLToPath} from 'node:url';

import lstrQuickSwitcher from '../src/quick-switcher.js';

/**
 * The switcher paints its own light panel, so it must never inherit text
 * color from the host page. A dark-themed host previously rendered
 * near-white text on the white panel.
 */
describe('stylesheet', () => {
    let css;

    beforeAll(() => {
        css = compile(
            fileURLToPath(new URL('../src/quick-switcher.scss', import.meta.url)),
            {loadPaths: [fileURLToPath(new URL('../src', import.meta.url))]}
        ).css;
    });

    it('sets an explicit text color on the container', () => {
        const rule = css.match(
            /\.lstr-qswitcher-container\s*\{[^}]*\bcolor:\s*#[0-9a-f]{3,6}/i
        );

        expect(rule).not.toBeNull();
    });

    it('keeps result text readable under a dark-themed host page', () => {
        document.head.innerHTML = `<style>${css}</style>`;
        document.body.style.color = '#e8eaed';

        const switcher = lstrQuickSwitcher({
            searchDelay: 0,
            searchCallback: (searchText, resultHandler) => {
                resultHandler.setResults(['Dashboard']);
            },
        });
        switcher.open();

        const li = document.querySelector('.lstr-qswitcher-results li');
        const color = getComputedStyle(li).color;

        // Anything inheriting the host's near-white body color would fail.
        expect(color).not.toBe('rgb(232, 234, 237)');

        switcher.destroy();
        document.head.innerHTML = '';
        document.body.style.color = '';
    });

    it('uses secondary text that clears WCAG AA on the panel', () => {
        // #999 on the #f5f6f7 panel is ~2.8:1; the replacement must not
        // regress back to it.
        expect(css).not.toMatch(/color:\s*#999\b/i);
    });
});
