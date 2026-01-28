/**
 * Selected Result Module
 * Wraps a selected item with metadata and control methods for tracking
 * and search text clearing behavior.
 */
define('selected-result', ['factories'], function(factories) {
    return {
        init(selectedValue, searchText, parent, domEvent) {
            this.selectedValue = selectedValue;
            this.searchText = searchText;
            this.parent = parent;
            this.domEvent = domEvent;
            this.trackingPrevented = false;
            this.searchTextClearingPrevented = false;
        },

        preventTracking() {
            this.trackingPrevented = true;
        },

        track() {
            if (!this.parent.trackChildrenAs || this.trackingPrevented) {
                return;
            }

            factories.tracker(this.parent.trackChildrenAs).trackSelection(
                this.selectedValue,
                this.searchText
            );
        },

        preventSearchTextClearing() {
            this.searchTextClearingPrevented = true;
        },

        isSearchTextClearingPrevented() {
            return this.searchTextClearingPrevented;
        }
    };
});
