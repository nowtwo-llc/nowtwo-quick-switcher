import {beforeEach, describe, expect, it} from 'vitest';

/**
 * The demo page is the project's public landing page and is deployed from CI,
 * so a runtime error in its wiring is a real failure. Building it proves the
 * module graph resolves; this proves it actually runs.
 */
describe('demo page', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="open-main"></button>
            <button id="open-simple"></button>
            <p id="demo-output" hidden></p>
            <span class="demo-hotkey"></span>
        `;
    });

    it('boots without throwing and wires up both switchers', async () => {
        await import('../demo/demo.js');

        document.querySelector('#open-main').click();

        expect(document.querySelectorAll('.lstr-qswitcher')).toHaveLength(2);

        expect(
            document.querySelector('.lstr-qswitcher-container[style*="block"]')
        ).not.toBeNull();

        expect(
            document.querySelectorAll('.lstr-qswitcher-results li').length
        ).toBeGreaterThan(0);

        expect(document.querySelector('.demo-hotkey').textContent)
            .toMatch(/Ctrl\+K|Cmd\+K/);
    });
});
