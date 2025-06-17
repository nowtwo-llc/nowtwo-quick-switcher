/**
 * Factories Module
 * Provides a factory for creating and caching tracker instances by name.
 * Ensures that only one instance per tracker name exists (singleton per name).
 */
define('factories', ['tracker'], (Tracker) => {
    // Cache for loaded tracker instances
    const loadedTrackers = {};

    return {
        /**
         * Get or create a tracker instance by name.
         * If the tracker already exists in the cache, return it.
         * Otherwise, create a new tracker, initialize it, cache it, and return it.
         *
         * @param {string} trackerName - The name of the tracker to retrieve or create
         * @returns {Object} The tracker instance
         */
        tracker(trackerName) {
            // Return cached tracker if it exists
            if (typeof loadedTrackers[trackerName] !== 'undefined') {
                return loadedTrackers[trackerName];
            }

            // Create and initialize a new tracker instance
            const trackerInstance = Object.create(Tracker);
            trackerInstance.init(trackerName);

            // Cache the new tracker instance
            loadedTrackers[trackerName] = trackerInstance;

            return loadedTrackers[trackerName];
        },
    };
});
