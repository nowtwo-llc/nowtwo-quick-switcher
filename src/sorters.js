/**
 * Sorters Module
 * Provides sorting capabilities using tracker-based scoring.
 */
define('sorters', ['factories'], (factories) => {
    return {
        tracker(trackerName) {
            return factories.tracker(trackerName);
        },
    };
});
