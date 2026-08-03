/**
 * Demo entry point.
 *
 * Models a workspace command palette: quick actions, direct navigation, and
 * nested searches for people, projects, documents, and settings.
 */

import lstrQuickSwitcher from '../src/index.js';
import '../src/quick-switcher.scss';

import people from './searches/people.js';
import projects from './searches/projects.js';
import documents from './searches/documents.js';
import settings from './searches/settings.js';
import demoError from './searches/error.js';
import { showSelection } from './log.js';

/** Nested searches, pinned above everything else. */
const SECTIONS = [people, projects, documents, settings];

/** One-shot commands. */
const ACTIONS = [
    { label: 'Create new project', hint: 'Action' },
    { label: 'Invite a teammate', hint: 'Action' },
    { label: 'Start a report', hint: 'Action' },
    { label: 'Export workspace data', hint: 'Action' },
    { label: 'Open command log', hint: 'Action' }
];

/** Direct navigation targets. */
const PLACES = [
    { label: 'Dashboard', hint: 'Go to' },
    { label: 'Inbox', hint: 'Go to' },
    { label: 'Analytics', hint: 'Go to' },
    { label: 'Billing', hint: 'Go to' },
    { label: 'Integrations', hint: 'Go to' },
    { label: 'Audit log', hint: 'Go to' },
    { label: 'Team directory', hint: 'Go to' },
    { label: 'Templates', hint: 'Go to' }
];

/**
 * Turn a flat entry into a tracked result.
 *
 * @param {Object} entry - The entry to convert.
 * @param {number} order - Static sort rank.
 * @returns {Object} A result item.
 */
const toResult = (entry, order) => ({
    text: entry.label,
    description: entry.hint,
    trackerId: entry.label,
    trackerStaticSort: order
});

const mainSwitcher = lstrQuickSwitcher({
    trackChildrenAs: 'main',
    searchDelay: 0,

    searchCallback(searchText, resultHandler) {
        const matches = (value) => resultHandler.filters.isMatch(searchText, value);

        const results = [
            // trackerStaticSort keeps the groups in order regardless of how
            // often individual entries get picked.
            ...SECTIONS.filter((section) => matches(`${section.text} ${section.description}`)).map((section) => ({
                ...section,
                trackerStaticSort: 0
            })),
            ...ACTIONS.filter((a) => matches(a.label)).map((a) => toResult(a, 1)),
            ...PLACES.filter((p) => matches(p.label)).map((p) => toResult(p, 2))
        ];

        if (matches('demo error failure')) {
            results.push({ ...demoError, trackerStaticSort: 3 });
        }

        resultHandler.setResults(results);
    },

    selectCallback(selected) {
        const value = selected.selectedValue;
        showSelection(`${value.description ?? 'Selected'}: ${value.text ?? value}`);
    }
});

const simpleSwitcher = lstrQuickSwitcher({
    hotKey: null,
    searchDelay: 0,

    searchCallback(searchText, resultHandler) {
        const options = ['Dashboard', 'Inbox', 'Projects', 'Reports', 'Settings'];

        resultHandler.setResults(options.filter((item) => resultHandler.filters.isMatch(searchText, item)));
    },

    selectCallback(selected) {
        showSelection(`Selected: ${selected.selectedValue}`);
    }
});

document.querySelector('#open-main').addEventListener('click', () => mainSwitcher.open());

document.querySelector('#open-simple').addEventListener('click', () => simpleSwitcher.open());

// Label the hotkey to match the visitor's platform.
const isApple = /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform || navigator.userAgent || '');

document.querySelectorAll('.demo-hotkey').forEach((element) => {
    element.textContent = isApple ? 'Cmd+K' : 'Ctrl+K';
});
