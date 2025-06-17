define('sorters', ['factories'], (factories) => {
    return {
        tracker(trackerName) {
            return factories.tracker(trackerName);
        },
    };
});
