import { beforeAll, describe, expect, it } from 'vitest';
import { compile } from 'sass';
import { resolve } from 'node:path';

import lstrQuickSwitcher from '../src/quick-switcher.js';

/**
 * The switcher paints its own light panel, so it must never inherit text
 * color from the host page. A dark-themed host previously rendered near-white
 * text on the white panel.
 */
describe('stylesheet', () => {
    let css;

    beforeAll(() => {
        // Resolved from cwd rather than import.meta.url: under Vitest's
        // transform the module URL is not a file: URL, which sass rejects.
        const src = resolve(process.cwd(), 'src');

        css = compile(resolve(src, 'quick-switcher.scss'), {
            loadPaths: [src]
        }).css;
    });

    it('sets an explicit text color on the container', () => {
        expect(css).toMatch(/\.lstr-qswitcher-container\s*\{[^}]*\bcolor:/i);
    });

    it('keeps result text readable under a dark-themed host page', () => {
        document.head.innerHTML = `<style>${css}</style>`;
        document.body.style.color = 'rgb(232, 234, 237)';

        const switcher = lstrQuickSwitcher({
            searchDelay: 0,
            searchCallback: (searchText, resultHandler) => {
                resultHandler.setResults(['Dashboard']);
            }
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

    it('does not regress to the low-contrast secondary color', () => {
        // #999 on the #f5f6f7 panel is ~2.8:1, under the WCAG AA 4.5:1 floor.
        expect(css).not.toMatch(/color:\s*#999\b/i);
    });

    it('routes every color through an overridable custom property', () => {
        const bare = [...css.matchAll(/^\s*(?:color|background-color):\s*(#[0-9a-f]{3,6}|rgba?\([^)]*\));/gim)].map(
            (match) => match[0].trim()
        );

        expect(bare).toEqual([]);
    });

    it('exposes the documented theming variables', () => {
        [
            '--lstr-qswitcher-bg',
            '--lstr-qswitcher-fg',
            '--lstr-qswitcher-muted',
            '--lstr-qswitcher-surface',
            '--lstr-qswitcher-accent',
            '--lstr-qswitcher-selected-bg',
            '--lstr-qswitcher-selected-fg'
        ].forEach((variable) => {
            expect(css).toContain(variable);
        });
    });
});
