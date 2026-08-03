/**
 * Sorters
 *
 * Sorting helpers exposed to consumers on the result handler as
 * `resultHandler.sorters`.
 */

import factories from './factories.js';

export const sorters = {
    /**
     * Get the tracker for a name, for manual ranking inside a search callback.
     *
     * @param {string} trackerName - The tracker name.
     * @returns {Object} The shared tracker instance for that name.
     */
    tracker(trackerName) {
        return factories.tracker(trackerName);
    }
};

export default sorters;
