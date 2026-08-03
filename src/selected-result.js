/**
 * SelectedResult
 *
 * Wraps a selected item with the context of its selection and the control
 * methods a select callback can use to alter default behavior.
 */

import factories from './factories.js';

export const SelectedResult = {
    /**
     * Initialize the selected result.
     *
     * @param {*} selectedValue - The item that was selected.
     * @param {string} searchText - The search text active at selection time.
     * @param {Object} parent - The options object the item was selected from.
     * @param {Event} domEvent - The DOM event that triggered the selection.
     */
    init(selectedValue, searchText, parent, domEvent) {
        this.selectedValue = selectedValue;
        this.searchText = searchText;
        this.parent = parent;
        this.domEvent = domEvent;
        this.trackingPrevented = false;
        this.searchTextClearingPrevented = false;
    },

    /**
     * Prevent this selection from being recorded by the tracker.
     */
    preventTracking() {
        this.trackingPrevented = true;
    },

    /**
     * Record this selection, unless tracking was prevented or the parent
     * search has no tracker configured.
     */
    track() {
        if (!this.parent || !this.parent.trackChildrenAs) {
            return;
        }

        if (this.trackingPrevented) {
            return;
        }

        factories.tracker(this.parent.trackChildrenAs).trackSelection(this.selectedValue, this.searchText);
    },

    /**
     * Keep the current search text when drilling into a nested search.
     */
    preventSearchTextClearing() {
        this.searchTextClearingPrevented = true;
    },

    /**
     * Whether search text clearing was prevented.
     *
     * @returns {boolean} True when the search text should be kept.
     */
    isSearchTextClearingPrevented() {
        return this.searchTextClearingPrevented;
    }
};

export default SelectedResult;
