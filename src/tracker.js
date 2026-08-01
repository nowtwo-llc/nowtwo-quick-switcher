/**
 * Tracker
 *
 * Persists which items a user selects and ranks future results accordingly.
 * One tracker exists per tracker name; see factories.js.
 */

import Selection from './tracker/selection.js';
import {readJson, writeJson} from './storage.js';

/** Prefix for every tracker's localStorage key. */
const STORAGE_PREFIX = 'qswitcher-tracker-';

/**
 * Compare two values, ordering lower values first.
 *
 * @param {*} a - Left operand.
 * @param {*} b - Right operand.
 * @returns {number} Standard comparator result.
 */
const compareLowerFirst = (a, b) => {
    if (a !== b) {
        return a < b ? -1 : 1;
    }

    return 0;
};

/**
 * Compare two values, ordering greater values first.
 *
 * @param {*} a - Left operand.
 * @param {*} b - Right operand.
 * @returns {number} Standard comparator result.
 */
const compareGreaterFirst = (a, b) => compareLowerFirst(b, a);

export const Tracker = {
    /**
     * Initialize the tracker and rehydrate persisted selections.
     *
     * @param {string} trackerName - Name used to namespace stored data.
     */
    init(trackerName) {
        this.name = trackerName;
        this.localStorageName = STORAGE_PREFIX + trackerName;
        this.selections = {};

        const stored = readJson(this.localStorageName);

        if (!stored || typeof stored !== 'object') {
            return;
        }

        Object.keys(stored).forEach((key) => {
            const selection = Object.create(Selection);
            selection.init(stored[key]);
            this.selections[key] = selection;
        });
    },

    /**
     * Record that an item was selected for a given search term.
     *
     * @param {Object} item - The selected item; requires a trackerId.
     * @param {string} searchText - The search text active at selection time.
     */
    trackSelection(item, searchText) {
        if (!item || !item.trackerId) {
            return;
        }

        const trackerId = item.trackerId;

        if (!this.selections[trackerId]) {
            this.selections[trackerId] = Object.create(Selection);
            this.selections[trackerId].init();
        }

        this.selections[trackerId].increment(searchText);

        this.save();
    },

    /**
     * Rank items by static sort, then score, then original order. Returns a
     * new array and leaves the caller's items untouched.
     *
     * @param {Array} items - The items to rank.
     * @param {string} searchText - The search text to score against.
     * @returns {Array} A new, ranked array of the same items.
     */
    sort(items, searchText) {
        const decorated = items.map((item, index) => ({
            item,
            index,
            score: this.scoreSelection(item, searchText),
            sort: (item && item.trackerStaticSort) || 0,
        }));

        decorated.sort((a, b) => {
            return compareLowerFirst(a.sort, b.sort)
                || compareGreaterFirst(a.score, b.score)
                || compareLowerFirst(a.index, b.index);
        });

        return decorated.map((entry) => entry.item);
    },

    /**
     * Persist the current selections.
     *
     * @returns {boolean} True when the write succeeded.
     */
    save() {
        return writeJson(this.localStorageName, this.selections);
    },

    /**
     * Score a single item for a given search term.
     *
     * @param {Object} item - The item to score; requires a trackerId.
     * @param {string} searchText - The search text to score against.
     * @returns {number} The item's score, or 0 when untracked.
     */
    scoreSelection(item, searchText) {
        if (!item || !item.trackerId) {
            return 0;
        }

        const selection = this.selections[item.trackerId];

        if (!selection) {
            return 0;
        }

        return selection.score(searchText);
    },

    /**
     * Forget all tracked selections for this tracker.
     */
    reset() {
        this.selections = {};
        this.save();
    },
};

export default Tracker;
