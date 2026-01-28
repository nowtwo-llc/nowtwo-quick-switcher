/**
 * Selection Tracker Module
 * Tracks and manages selection statistics for search terms and overall usage.
 * Provides scoring mechanism based on selection frequency and recency.
 */
define('tracker/selection', ['tracker/statistic'], function(Statistic) {
    /**
     * Normalizes search keys to lowercase for consistent comparison
     * @param {string} searchKey - The search key to normalize
     * @returns {string} The normalized search key in lowercase
     */
    const canonicalizeSearchKey = (searchKey) => {
        return searchKey.toLowerCase();
    };

    return {
        /**
         * Initialize the selection tracker with optional existing data
         * @param {Object} [data] - Optional data to initialize the tracker with
         * @param {Object} [data.overall] - Overall selection statistics
         * @param {Object} [data.searchKeys] - Statistics for specific search keys
         */
        init(data) {
            if (data) {
                const selection = this;

                // Initialize overall statistics
                this.overall = Statistic.create(data.overall);
                this.searchKeys = {};

                // Initialize statistics for each search key
                Object.keys(data.searchKeys).forEach((searchKey) => {
                    searchKey = canonicalizeSearchKey(searchKey);

                    const stat = Statistic.create(data.searchKeys[searchKey]);
                    selection.searchKeys[searchKey] = stat;
                });

                return;
            }

            // Initialize empty statistics if no data provided
            this.overall = Statistic.create();
            this.searchKeys = {};
        },

        /**
         * Increment the selection count for a search term
         * @param {string} [searchText] - The search text to increment, if any
         */
        increment(searchText) {
            // Always increment overall statistics
            this.overall.increment();

            if (!searchText) {
                return;
            }

            // Normalize and increment search-specific statistics
            searchText = canonicalizeSearchKey(searchText);

            if (!this.searchKeys[searchText]) {
                this.searchKeys[searchText] = Statistic.create();
            }
            this.searchKeys[searchText].increment();
        },

        /**
         * Calculate the score for a search term
         * @param {string} [searchText] - The search text to score
         * @returns {number} The calculated score for the search term
         */
        score(searchText) {
            searchText = canonicalizeSearchKey(searchText);

            // If no search text or no statistics for this search, return half of overall score
            if (!searchText || !this.searchKeys[searchText]) {
                return this.overall.score() * 0.5;
            }

            // Return the specific score for this search term
            return this.searchKeys[searchText].score();
        },
    };
});