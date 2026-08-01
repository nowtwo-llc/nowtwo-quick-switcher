import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import lstrQuickSwitcher from '../src/quick-switcher.js';
import factories from '../src/factories.js';

/** Instances created by a test, torn down afterwards. */
let instances = [];

/**
 * Create a switcher and register it for teardown.
 *
 * @param {Object} [options] - Switcher options.
 * @returns {Object} The switcher's public API.
 */
const createSwitcher = (options = {}) => {
    const switcher = lstrQuickSwitcher({searchDelay: 0, ...options});
    instances.push(switcher);

    return switcher;
};

/**
 * Build a search callback that always returns the given items.
 *
 * @param {Array} items - Items to return.
 * @returns {Function} A search callback.
 */
const staticSearch = (items) => (searchText, resultHandler) => {
    resultHandler.setResults(items);
};

/** @returns {HTMLElement} The most recently rendered switcher root. */
const root = () => document.body.querySelector('.lstr-qswitcher:last-of-type');

/** @returns {HTMLInputElement} The search input. */
const input = () => root().querySelector('.lstr-qswitcher-search');

/** @returns {HTMLElement[]} The rendered result items. */
const items = () => Array.from(
    root().querySelectorAll('.lstr-qswitcher-results li')
);

/** @returns {HTMLElement} The selected result item. */
const selected = () => root().querySelector('.lstr-qswitcher-result-selected');

/**
 * Type into the search box and flush the debounce.
 *
 * @param {string} text - The text to type.
 * @param {string} [key] - The key reported on the keyup event.
 */
const type = (text, key = 'a') => {
    input().value = text;
    input().dispatchEvent(
        new KeyboardEvent('keyup', {key, bubbles: true})
    );
    vi.advanceTimersByTime(50);
};

/**
 * Dispatch a keydown on the document.
 *
 * @param {string} key - The key value.
 * @param {Object} [modifiers] - Extra event properties.
 */
const press = (key, modifiers = {}) => {
    document.dispatchEvent(
        new KeyboardEvent('keydown', {key, bubbles: true, ...modifiers})
    );
};

describe('quick switcher', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        factories.clear();
        document.body.innerHTML = '';
        document.body.className = '';
        instances = [];
    });

    afterEach(() => {
        instances.forEach((switcher) => switcher.destroy());
        vi.useRealTimers();
    });

    describe('lifecycle', () => {
        it('renders itself into the document, closed', () => {
            createSwitcher();

            expect(root()).not.toBeNull();
            expect(root().querySelector('.lstr-qswitcher-container').style.display)
                .not.toBe('block');
        });

        it('opens, closes, and reports its state', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});

            expect(switcher.isOpen()).toBe(false);

            switcher.open();
            expect(switcher.isOpen()).toBe(true);
            expect(root().querySelector('.lstr-qswitcher-container').style.display)
                .toBe('block');

            switcher.close();
            expect(switcher.isOpen()).toBe(false);
        });

        it('toggles', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});

            switcher.toggle();
            expect(switcher.isOpen()).toBe(true);

            switcher.toggle();
            expect(switcher.isOpen()).toBe(false);
        });

        it('locks page scrolling only while open', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});

            switcher.open();
            expect(document.body.classList.contains('lstr-qswitcher-noscroll'))
                .toBe(true);

            switcher.close();
            expect(document.body.classList.contains('lstr-qswitcher-noscroll'))
                .toBe(false);
        });

        it('does not unlock scrolling when opened twice', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});

            switcher.open();
            switcher.open();

            expect(document.body.classList.contains('lstr-qswitcher-noscroll'))
                .toBe(true);
        });

        it('opens on the Ctrl+K hotkey', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});

            press('k', {ctrlKey: true});

            expect(switcher.isOpen()).toBe(true);
        });

        it('ignores the hotkey without its modifier', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});

            press('k');

            expect(switcher.isOpen()).toBe(false);
        });

        it('binds no hotkey when hotKey is null', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([]),
                hotKey: null,
            });

            press('k', {ctrlKey: true});

            expect(switcher.isOpen()).toBe(false);
        });

        it('closes on Escape', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.open();

            press('Escape');

            expect(switcher.isOpen()).toBe(false);
        });

        it('closes when the overlay is clicked', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.open();

            root().querySelector('.lstr-qswitcher-overlay').click();

            expect(switcher.isOpen()).toBe(false);
        });

        it('accepts a custom parent element', () => {
            const host = document.createElement('div');
            document.body.appendChild(host);

            createSwitcher({
                searchCallback: staticSearch([]),
                parentDom: host,
            });

            expect(host.querySelector('.lstr-qswitcher')).not.toBeNull();
        });
    });

    describe('results rendering', () => {
        it('renders plain string results', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch(['Alpha', 'Beta']),
            });
            switcher.open();

            expect(items()).toHaveLength(2);
            expect(items()[0].textContent.trim()).toBe('Alpha');
        });

        it('renders the text property as plain text, not markup', () => {
            const payload = '<img src=x onerror="window.__xss = true">';
            const switcher = createSwitcher({
                searchCallback: staticSearch([{text: payload}]),
            });
            switcher.open();

            expect(root().querySelector('img')).toBeNull();
            expect(items()[0].textContent).toContain('<img');
            expect(window.__xss).toBeUndefined();
        });

        it('renders the html property as markup', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([{html: '<em>Emphasis</em>'}]),
            });
            switcher.open();

            expect(root().querySelector('em')).not.toBeNull();
        });

        it('resolves text and html supplied as functions', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([{text: () => 'Lazy'}]),
            });
            switcher.open();

            expect(items()[0].textContent.trim()).toBe('Lazy');
        });

        it('renders descriptions', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([
                    {text: 'Alpha', description: 'First letter'},
                ]),
            });
            switcher.open();

            const description = root()
                .querySelector('.lstr-qswitcher-result-description');

            expect(description.textContent.trim()).toBe('First letter');
        });

        it('escapes descriptions too', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([
                    {text: 'Alpha', description: '<b>bold</b>'},
                ]),
            });
            switcher.open();

            expect(root().querySelector('.lstr-qswitcher-result-description b'))
                .toBeNull();
        });

        it('flags nested searches with a category class', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([
                    {text: 'Colors', searchCallback: staticSearch([])},
                ]),
            });
            switcher.open();

            expect(items()[0].classList.contains('lstr-qswitcher-result-category'))
                .toBe(true);
        });

        it('shows the no-terms pane for an empty search with no results', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.open();

            expect(root().querySelector('.lstr-qswitcher-no-terms').style.display)
                .toBe('block');
        });

        it('shows the no-results pane once a term is entered', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.open();
            type('zzz');

            expect(root().querySelector('.lstr-qswitcher-no-results').style.display)
                .toBe('block');
        });

        it('shows the error pane when setError is called', () => {
            const switcher = createSwitcher({
                searchCallback: (searchText, resultHandler) => {
                    resultHandler.setError();
                },
            });
            switcher.open();

            expect(root().querySelector('.lstr-qswitcher-oops-results').style.display)
                .toBe('block');
        });

        it('shows the error pane when the search callback throws', () => {
            const switcher = createSwitcher({
                searchCallback: () => {
                    throw new Error('search exploded');
                },
            });

            expect(() => switcher.open()).not.toThrow();
            expect(root().querySelector('.lstr-qswitcher-oops-results').style.display)
                .toBe('block');
        });

        it('discards results from a superseded search', () => {
            let staleHandler = null;
            const switcher = createSwitcher({
                searchCallback: (searchText, resultHandler) => {
                    if (searchText === '') {
                        staleHandler = resultHandler;
                        return;
                    }
                    resultHandler.setResults(['Fresh']);
                },
            });

            switcher.open();
            type('new');

            staleHandler.setResults(['Stale']);

            expect(items()).toHaveLength(1);
            expect(items()[0].textContent.trim()).toBe('Fresh');
        });

        it('passes the search text to the callback', () => {
            const searchCallback = vi.fn((searchText, resultHandler) => {
                resultHandler.setResults([]);
            });
            const switcher = createSwitcher({searchCallback});
            switcher.open();

            type('hello');

            expect(searchCallback).toHaveBeenLastCalledWith(
                'hello',
                expect.anything()
            );
        });

        it('exposes filters and sorters on the result handler', () => {
            let handler = null;
            const switcher = createSwitcher({
                searchCallback: (searchText, resultHandler) => {
                    handler = resultHandler;
                    resultHandler.setResults([]);
                },
            });
            switcher.open();

            expect(typeof handler.filters.isMatch).toBe('function');
            expect(typeof handler.sorters.tracker).toBe('function');
        });

        it('debounces searching by searchDelay', () => {
            const searchCallback = vi.fn((searchText, resultHandler) => {
                resultHandler.setResults([]);
            });
            const switcher = createSwitcher({searchCallback, searchDelay: 500});
            switcher.open();

            searchCallback.mockClear();

            input().value = 'abc';
            input().dispatchEvent(new KeyboardEvent('keyup', {key: 'c'}));

            vi.advanceTimersByTime(499);
            expect(searchCallback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(searchCallback).toHaveBeenCalledOnce();
        });
    });

    describe('keyboard navigation', () => {
        /**
         * Open a switcher with three results.
         *
         * @returns {Object} The switcher.
         */
        const openThree = () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One', 'Two', 'Three']),
            });
            switcher.open();

            return switcher;
        };

        it('selects the first result on render', () => {
            openThree();

            expect(selected().textContent.trim()).toBe('One');
        });

        it('moves down with ArrowDown', () => {
            openThree();

            press('ArrowDown');

            expect(selected().textContent.trim()).toBe('Two');
        });

        it('moves up with ArrowUp', () => {
            openThree();

            press('ArrowDown');
            press('ArrowUp');

            expect(selected().textContent.trim()).toBe('One');
        });

        it('wraps from the last result to the first', () => {
            openThree();

            press('ArrowDown');
            press('ArrowDown');
            press('ArrowDown');

            expect(selected().textContent.trim()).toBe('One');
        });

        it('wraps from the first result to the last', () => {
            openThree();

            press('ArrowUp');

            expect(selected().textContent.trim()).toBe('Three');
        });

        it('ignores navigation keys while closed', () => {
            createSwitcher({searchCallback: staticSearch(['One'])});

            expect(() => press('ArrowDown')).not.toThrow();
        });

        it('tracks the selection with aria-activedescendant', () => {
            openThree();

            expect(input().getAttribute('aria-activedescendant'))
                .toBe(selected().id);
            expect(selected().getAttribute('aria-selected')).toBe('true');
        });

        it('gives each instance distinct element ids', () => {
            createSwitcher({searchCallback: staticSearch([])});
            const firstId = document.body
                .querySelector('.lstr-qswitcher .lstr-qswitcher-search').id;

            createSwitcher({searchCallback: staticSearch([])});
            const ids = Array.from(
                document.body.querySelectorAll('.lstr-qswitcher-search')
            ).map((element) => element.id);

            expect(new Set(ids).size).toBe(2);
            expect(ids[0]).toBe(firstId);
        });

        it('scrolls the results pane to reveal an off-screen selection', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One', 'Two']),
            });
            switcher.open();

            // jsdom reports zero for every layout property, so geometry has
            // to be stubbed for this assertion to mean anything.
            const results = root().querySelector('.lstr-qswitcher-results');
            Object.defineProperty(results, 'offsetHeight', {value: 40});
            items().forEach((li, index) => {
                Object.defineProperty(li, 'offsetTop', {value: index * 30});
                Object.defineProperty(li, 'offsetHeight', {value: 30});
            });

            press('ArrowDown');

            expect(results.scrollTop).toBe(30);
        });
    });

    describe('selection', () => {
        it('invokes selectCallback with the selected value', () => {
            const selectCallback = vi.fn();
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One', 'Two']),
                selectCallback,
            });
            switcher.open();

            press('Enter');

            expect(selectCallback).toHaveBeenCalledOnce();
            expect(selectCallback.mock.calls[0][0].selectedValue).toBe('One');
        });

        it('selects on click', () => {
            const selectCallback = vi.fn();
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One', 'Two']),
                selectCallback,
            });
            switcher.open();

            items()[1].click();

            expect(selectCallback.mock.calls[0][0].selectedValue).toBe('Two');
        });

        it('selects on hover then Enter', () => {
            const selectCallback = vi.fn();
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One', 'Two']),
                selectCallback,
            });
            switcher.open();

            items()[1].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
            press('Enter');

            expect(selectCallback.mock.calls[0][0].selectedValue).toBe('Two');
        });

        it('closes after a selection', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One']),
                selectCallback: () => {},
            });
            switcher.open();

            press('Enter');

            expect(switcher.isOpen()).toBe(false);
        });

        it('stays open when selectCallback returns false', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One']),
                selectCallback: () => false,
            });
            switcher.open();

            press('Enter');

            expect(switcher.isOpen()).toBe(true);
        });

        it('passes the active search text on the selected result', () => {
            const selectCallback = vi.fn();
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One']),
                selectCallback,
            });
            switcher.open();
            type('on');

            press('Enter');

            expect(selectCallback.mock.calls[0][0].searchText).toBe('on');
        });

        it('does nothing when Enter is pressed with no results', () => {
            const selectCallback = vi.fn();
            const switcher = createSwitcher({
                searchCallback: staticSearch([]),
                selectCallback,
            });
            switcher.open();

            press('Enter');

            expect(selectCallback).not.toHaveBeenCalled();
        });
    });

    describe('nested searches', () => {
        /**
         * Build a root search containing one nested search.
         *
         * @param {Object} [overrides] - Extra properties for the nested item.
         * @returns {Object} The switcher.
         */
        const openNested = (overrides = {}) => {
            const child = {
                text: 'Colors',
                breadcrumbText: 'Colors',
                searchCallback: staticSearch(['Red', 'Blue']),
                ...overrides,
            };

            const switcher = createSwitcher({
                searchCallback: staticSearch([child, 'Other']),
            });
            switcher.open();

            return switcher;
        };

        it('drills into the nested search on selection', () => {
            openNested();

            press('Enter');

            expect(items().map((li) => li.textContent.trim()))
                .toEqual(['Red', 'Blue']);
        });

        it('renders a breadcrumb for the nested search', () => {
            openNested();

            press('Enter');

            expect(root().querySelector('.lstr-qswitcher-breadcrumb').textContent)
                .toContain('Colors');
            expect(root().classList.contains('lstr-qswitcher-subsearch'))
                .toBe(true);
        });

        it('clears the search text when drilling in', () => {
            openNested();
            type('col');

            press('Enter');

            expect(input().value).toBe('');
        });

        it('keeps the search text when clearing is prevented', () => {
            openNested();
            const switcher = instances[instances.length - 1];
            void switcher;

            // Re-create with a callback that prevents clearing.
            document.body.innerHTML = '';
            const nested = createSwitcher({
                searchCallback: staticSearch([{
                    text: 'Colors',
                    breadcrumbText: 'Colors',
                    searchCallback: staticSearch(['Red']),
                }]),
                selectChildSearchCallback: (selectedResult) => {
                    selectedResult.preventSearchTextClearing();
                },
            });
            nested.open();
            type('col');

            press('Enter');

            expect(input().value).toBe('col');
        });

        it('blocks the drill-down when the child callback returns false', () => {
            document.body.innerHTML = '';
            const switcher = createSwitcher({
                searchCallback: staticSearch([{
                    text: 'Colors',
                    breadcrumbText: 'Colors',
                    searchCallback: staticSearch(['Red']),
                }]),
                selectChildSearchCallback: () => false,
            });
            switcher.open();

            press('Enter');

            expect(items().map((li) => li.textContent.trim())).toEqual(['Colors']);
        });

        it('steps back out on Backspace in an empty search box', () => {
            openNested();
            press('Enter');
            expect(items()).toHaveLength(2);

            type('', 'Backspace');

            expect(items().map((li) => li.textContent.trim()))
                .toEqual(['Colors', 'Other']);
            expect(root().classList.contains('lstr-qswitcher-subsearch'))
                .toBe(false);
        });

        it('returns to the root search when reopened', () => {
            const switcher = openNested();
            press('Enter');

            switcher.close();
            switcher.open();

            expect(items().map((li) => li.textContent.trim()))
                .toEqual(['Colors', 'Other']);
        });

        it('inherits selectCallback into a nested search that omits it', () => {
            const selectCallback = vi.fn();
            document.body.innerHTML = '';
            const switcher = createSwitcher({
                searchCallback: staticSearch([{
                    text: 'Colors',
                    breadcrumbText: 'Colors',
                    searchCallback: staticSearch(['Red']),
                }]),
                selectCallback,
            });
            switcher.open();

            press('Enter');
            press('Enter');

            expect(selectCallback).toHaveBeenCalledOnce();
            expect(selectCallback.mock.calls[0][0].selectedValue).toBe('Red');
        });

        it('keeps callbacks working after stepping back out of two levels', () => {
            const selectCallback = vi.fn();
            document.body.innerHTML = '';

            // The middle search declares no selectCallback of its own, so it
            // relies on inheritance both going in and coming back out.
            const switcher = createSwitcher({
                searchCallback: staticSearch([{
                    text: 'Level one',
                    breadcrumbText: 'One',
                    searchCallback: staticSearch([{
                        text: 'Level two',
                        breadcrumbText: 'Two',
                        searchCallback: staticSearch(['Leaf']),
                    }]),
                }]),
                selectCallback,
            });
            switcher.open();

            press('Enter');
            press('Enter');
            type('', 'Backspace');
            press('Enter');
            press('Enter');

            expect(selectCallback).toHaveBeenCalledOnce();
            expect(selectCallback.mock.calls[0][0].selectedValue).toBe('Leaf');
        });

        it('exposes the parent item on the selected result', () => {
            const selectCallback = vi.fn();
            document.body.innerHTML = '';
            const switcher = createSwitcher({
                searchCallback: staticSearch([{
                    text: 'Colors',
                    breadcrumbText: 'Colors',
                    customProperty: 'kept',
                    searchCallback: staticSearch(['Red']),
                }]),
                selectCallback,
            });
            switcher.open();

            press('Enter');
            press('Enter');

            expect(selectCallback.mock.calls[0][0].parent.customProperty)
                .toBe('kept');
        });
    });

    describe('tracking', () => {
        it('ranks previously selected results first', () => {
            const results = [
                {text: 'Apple', trackerId: 'apple'},
                {text: 'Banana', trackerId: 'banana'},
            ];
            const switcher = createSwitcher({
                searchCallback: staticSearch(results),
                selectCallback: () => {},
                trackChildrenAs: 'fruit',
            });

            switcher.open();
            press('ArrowDown');
            press('Enter');

            switcher.open();

            expect(items()[0].textContent.trim()).toBe('Banana');
        });

        it('does not track when tracking is prevented', () => {
            const results = [
                {text: 'Apple', trackerId: 'apple'},
                {text: 'Banana', trackerId: 'banana'},
            ];
            const switcher = createSwitcher({
                searchCallback: staticSearch(results),
                selectCallback: (selectedResult) => {
                    selectedResult.preventTracking();
                },
                trackChildrenAs: 'fruit',
            });

            switcher.open();
            press('ArrowDown');
            press('Enter');

            switcher.open();

            expect(items()[0].textContent.trim()).toBe('Apple');
        });

        it('leaves results untracked without trackChildrenAs', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch([{text: 'Apple', trackerId: 'apple'}]),
                selectCallback: () => {},
            });

            switcher.open();
            press('Enter');

            expect(localStorage.length).toBe(0);
        });
    });

    describe('destroy', () => {
        it('removes its element from the document', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.destroy();

            expect(document.body.querySelector('.lstr-qswitcher')).toBeNull();
        });

        it('detaches its document-level hotkey listener', () => {
            const searchCallback = vi.fn(staticSearch([]));
            const switcher = createSwitcher({searchCallback});
            switcher.destroy();

            searchCallback.mockClear();
            press('k', {ctrlKey: true});

            expect(searchCallback).not.toHaveBeenCalled();
        });

        it('detaches its document-level navigation listener', () => {
            const switcher = createSwitcher({
                searchCallback: staticSearch(['One', 'Two']),
            });
            switcher.open();
            switcher.destroy();

            expect(() => press('ArrowDown')).not.toThrow();
        });

        it('releases the page scroll lock', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.open();
            switcher.destroy();

            expect(document.body.classList.contains('lstr-qswitcher-noscroll'))
                .toBe(false);
        });

        it('is safe to call twice', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.destroy();

            expect(() => switcher.destroy()).not.toThrow();
        });

        it('ignores open() after destruction', () => {
            const switcher = createSwitcher({searchCallback: staticSearch([])});
            switcher.destroy();

            switcher.open();

            expect(switcher.isOpen()).toBe(false);
        });

        it('leaves a sibling instance working', () => {
            const first = createSwitcher({searchCallback: staticSearch([])});
            const secondSearch = vi.fn(staticSearch(['Still here']));
            const second = createSwitcher({searchCallback: secondSearch});

            first.destroy();
            second.open();

            expect(second.isOpen()).toBe(true);
            expect(secondSearch).toHaveBeenCalled();
        });
    });
});
