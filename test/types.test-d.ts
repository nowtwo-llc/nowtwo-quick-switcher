/**
 * Compile-time exercise of the public type definitions. This file is never
 * run and never published -- `npm run typecheck` fails if the declarations
 * stop describing real usage.
 */

import lstrQuickSwitcher from '../types/index.js';
import type {
    ResultInput,
    SearchCallback,
    SelectedResult,
} from '../types/index.js';

// Minimal construction.
const minimal = lstrQuickSwitcher();
minimal.open();
minimal.close();
minimal.toggle();
minimal.destroy();

const open: boolean = minimal.isOpen();
void open;

// No options at all is valid.
lstrQuickSwitcher({});

// A fully specified switcher.
const search: SearchCallback = (searchText, resultHandler) => {
    const items: ResultInput[] = [
        'a bare string',
        {text: 'Plain text label'},
        {html: '<em>markup</em>'},
        {text: () => 'lazy label'},
        {text: 'With description', description: 'secondary'},
        {text: 'With html description', description: {html: '<b>!</b>'}},
        {
            text: 'Nested',
            breadcrumbText: 'Nested',
            searchCallback: (unusedText, handler) => handler.setResults([]),
        },
        {text: 'Tracked', trackerId: 'tracked', trackerStaticSort: -1},
        {text: 'Custom', anythingElse: {kept: true}},
    ];

    const matched = items.filter((item) => {
        return resultHandler.filters.isMatch(
            searchText,
            typeof item === 'string' ? item : item.text,
        );
    });

    resultHandler.sorters.tracker('main').sort(matched, searchText);
    resultHandler.setResults(matched);
    resultHandler.setError();

    // Returning an abort function is allowed.
    return () => {};
};

lstrQuickSwitcher({
    searchCallback: search,
    searchDelay: 0,
    hotKey: null,
    trackChildrenAs: 'main',
    parentDom: document.createElement('div'),

    selectCallback: (selected: SelectedResult) => {
        selected.preventTracking();
        const text: string = selected.searchText;
        void text;

        // Keeping the switcher open.
        return false;
    },

    selectChildSearchCallback: (selected) => {
        selected.preventSearchTextClearing();
        const prevented: boolean = selected.isSearchTextClearingPrevented();
        void prevented;
    },
});

// The helpers hang off the factory itself.
const isMatch: boolean = lstrQuickSwitcher.filters.isMatch('a', 'abc');
const wordsFound: boolean = lstrQuickSwitcher.filters.areWordsFound('a', 'abc');
void isMatch;
void wordsFound;

lstrQuickSwitcher.sorters.tracker('main').reset();
