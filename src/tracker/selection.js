/**
 * Selection
 *
 * Tracks selection statistics for a single item, both overall and per search
 * term, so that scoring can favor the item you usually pick for a given query.
 */

import Statistic from './statistic.js';

/**
 * Normalize a search key so lookups are case-insensitive.
 *
 * @param {*} searchKey - The search key to normalize.
 * @returns {string} The lowercase key, or '' for null/undefined.
 */
const canonicalizeSearchKey = (searchKey) => {
    if (searchKey === null || searchKey === undefined) {
        return '';
    }

    return String(searchKey).toLowerCase();
};

export const Selection = {
    /**
     * Initialize the selection, tolerating partial or malformed stored data.
     *
     * @param {Object} [data] - Previously persisted data to rehydrate from.
     * @param {Object} [data.overall] - Overall selection statistics.
     * @param {Object} [data.searchKeys] - Per-search-term statistics.
     */
    init(data) {
        this.overall = Statistic.create(data ? data.overall : undefined);
        this.searchKeys = {};

        if (!data || !data.searchKeys || typeof data.searchKeys !== 'object') {
            return;
        }

        // Read using the stored key, write using the canonical one, so keys
        // persisted before normalization existed are still recovered.
        Object.keys(data.searchKeys).forEach((storedKey) => {
            const searchKey = canonicalizeSearchKey(storedKey);

            this.searchKeys[searchKey] = Statistic.create(data.searchKeys[storedKey]);
        });
    },

    /**
     * Record a selection, both overall and against the search term used.
     *
     * @param {string} [searchText] - The search text active at selection time.
     */
    increment(searchText) {
        this.overall.increment();

        const searchKey = canonicalizeSearchKey(searchText);

        if (!searchKey) {
            return;
        }

        if (!this.searchKeys[searchKey]) {
            this.searchKeys[searchKey] = Statistic.create();
        }

        this.searchKeys[searchKey].increment();
    },

    /**
     * Score this selection for a given search term. Terms with no history of
     * their own fall back to half the overall score, so a broadly popular
     * item still ranks without dominating a specific query.
     *
     * @param {string} [searchText] - The search text being scored against.
     * @returns {number} The calculated score.
     */
    score(searchText) {
        const searchKey = canonicalizeSearchKey(searchText);

        if (!searchKey || !this.searchKeys[searchKey]) {
            return this.overall.score() * 0.5;
        }

        return this.searchKeys[searchKey].score();
    }
};

export default Selection;
