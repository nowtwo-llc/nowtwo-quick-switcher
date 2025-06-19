/**
 * Tracker Module
 * Tracks user selections and provides sorting and scoring for items based on user interaction history.
 * Uses localStorage to persist selection data between sessions.
 */
define('tracker', ['tracker/selection'], function(Selection) {
    /**
     * Compare two values, sorting lower values first.
     * @param {*} a
     * @param {*} b
     * @returns {number}
     */
    const compareLowerFirst = (a, b) => {
        if (a != b) {
            return a < b ? -1 : 1;
        }
    };
    /**
     * Compare two values, sorting greater values first.
     * @param {*} a
     * @param {*} b
     * @returns {number}
     */
    const compareGreaterFirst = (a, b) => {
        return compareLowerFirst(b, a);
    };

    return {
        /**
         * Initialize the tracker with a name and load persisted selections from localStorage.
         * @param {string} trackerName - The name of the tracker (used as a key in localStorage)
         */
        init(trackerName) {
            this.name = trackerName;
            this.localStorageName = 'qswitcher-tracker-' + trackerName;
            this.selections = {};

            // If localStorage is not available, do nothing
            if (!window.localStorage) {
                return;
            }

            // Load selections from localStorage if available
            const selections = localStorage.getItem(this.localStorageName);
            if (selections) {
                this.selections = JSON.parse(selections);

                // Re-instantiate Selection objects from plain data
                const tracker = this;
                Object.keys(this.selections).forEach((key) => {
                    const selection = Object.create(Selection);
                    selection.init(tracker.selections[key]);
                    tracker.selections[key] = selection;
                });
            }
        },

        /**
         * Track a selection for a given item and search text.
         * @param {Object} item - The item being selected (must have trackerId)
         * @param {string} searchText - The search text used for the selection
         */
        trackSelection(item, searchText) {
            if (!item.trackerId) {
                return;
            }

            const trackerId = item.trackerId;

            // Create a new Selection if one doesn't exist for this trackerId
            if (!this.selections[trackerId]) {
                this.selections[trackerId] = Object.create(Selection);
                this.selections[trackerId].init();
            }

            // Increment the selection count for this item
            this.selections[trackerId].increment(searchText);

            // Persist the updated selections
            this.save();
        },

        /**
         * Sort items based on static sort, score, and original index.
         * @param {Array} items - The items to sort
         * @param {string} searchText - The search text used for scoring
         * @returns {Array} The sorted items
         */
        sort(items, searchText) {
            const tracker = this;
            // Attach sorting metadata to each item
            items.forEach((item, index) => {
                item._qswitcher = {
                    index: index,
                    score: tracker.scoreSelection(item, searchText),
                    sort: item.trackerStaticSort ? item.trackerStaticSort : 0,
                };
            });

            // Sort by static sort, then score, then original index
            items.sort((a, b) => {
                return compareLowerFirst(a._qswitcher.sort, b._qswitcher.sort)
                    || compareGreaterFirst(a._qswitcher.score, b._qswitcher.score)
                    || compareLowerFirst(a._qswitcher.index, b._qswitcher.index);
            });

            // Clean up metadata
            items.forEach((item) => {
                delete item._qswitcher;
            });

            return items;
        },

        /**
         * Save the current selections to localStorage.
         */
        save() {
            if (!window.localStorage) {
                return;
            }

            localStorage.setItem(
                this.localStorageName,
                JSON.stringify(this.selections)
            );
        },

        /**
         * Get the score for a selection of an item with a given search text.
         * @param {Object} item - The item to score (must have trackerId)
         * @param {string} searchText - The search text used for scoring
         * @returns {number} The score for the selection
         */
        scoreSelection(item, searchText) {
            const selection = this.selections[item.trackerId];

            if (typeof selection === 'undefined') {
                return 0;
            }

            return selection.score(searchText);
        },
    };
});
