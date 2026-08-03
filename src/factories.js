/**
 * Factories
 *
 * Provides one shared tracker instance per tracker name, so that separate
 * quick switcher instances pointed at the same name share selection history.
 */

import Tracker from './tracker.js';

/** Cache of tracker instances, keyed by tracker name. */
const loadedTrackers = {};

export const factories = {
    /**
     * Get the tracker for a name, creating it on first use.
     *
     * @param {string} trackerName - The tracker name.
     * @returns {Object} The shared tracker instance for that name.
     */
    tracker(trackerName) {
        if (loadedTrackers[trackerName]) {
            return loadedTrackers[trackerName];
        }

        const trackerInstance = Object.create(Tracker);
        trackerInstance.init(trackerName);

        loadedTrackers[trackerName] = trackerInstance;

        return trackerInstance;
    },

    /**
     * Drop every cached tracker. Primarily useful in tests.
     */
    clear() {
        Object.keys(loadedTrackers).forEach((key) => {
            delete loadedTrackers[key];
        });
    }
};

export default factories;
