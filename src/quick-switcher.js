/**
 * Quick Switcher
 *
 * A keyboard-driven command palette: search, drill down into nested searches
 * with breadcrumbs, and rank results by how the user has picked them before.
 */

import filters from './filters.js';
import SelectedResult from './selected-result.js';
import sorters from './sorters.js';
import createTemplate from './template.js';

/**
 * Shared prototype for the object handed to each search callback.
 */
const ResultHandler = {
    filters,
    sorters,
};

/**
 * Counter used to namespace element IDs so multiple instances can coexist.
 */
let instanceCount = 0;

/**
 * Resolve a value that may be supplied either directly or as a factory.
 *
 * @param {*} value - Either a function to call or a plain value.
 * @returns {*} The resolved value.
 */
const callbackOrValue = (value) => {
    return typeof value === 'function' ? value() : value;
};

/**
 * Detect macOS (and iOS) so the hotkey uses Cmd rather than Ctrl.
 * navigator.platform is deprecated, so prefer userAgentData where present.
 *
 * @returns {boolean} True on Apple platforms.
 */
const isApplePlatform = () => {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const uaData = navigator.userAgentData;

    if (uaData && typeof uaData.platform === 'string' && uaData.platform) {
        return uaData.platform.toLowerCase().includes('mac');
    }

    return /mac|iphone|ipad|ipod/i.test(
        navigator.userAgent || navigator.platform || ''
    );
};

const QuickSwitcher = {
    /**
     * Initialize the switcher and attach it to the DOM.
     *
     * @param {HTMLElement} parentDom - Element to append the switcher to.
     * @param {Object} options - Configuration options.
     */
    init(parentDom, options) {
        this.isOpen = false;
        this.destroyed = false;
        this.parentDom = null;
        this.valueObjects = [];
        this.selectedIndex = null;
        this.searchText = '';
        this.searchDelayTimeout = null;
        this.searchId = 0;
        this.callbackStack = [];
        this.abortSearchCallback = null;
        this.idPrefix = `lstr-qswitcher-${++instanceCount}`;

        // Every listener registers against this signal so destroy() can
        // detach all of them at once, including the document-level ones.
        this.listenerController = new AbortController();

        this.modifierKey = isApplePlatform() ? 'metaKey' : 'ctrlKey';

        options = Object.assign({
            searchCallback: () => {},
            selectCallback: () => {},
            selectChildSearchCallback: () => {},
            searchDelay: 1000,
            hotKey: 'K',
        }, options);

        this.hotKey = options.hotKey
            ? String(options.hotKey).toUpperCase()
            : null;

        this.rootOptions = {
            searchCallback: options.searchCallback,
            selectCallback: options.selectCallback,
            selectChildSearchCallback: options.selectChildSearchCallback,
            searchDelay: options.searchDelay,
            trackChildrenAs: options.trackChildrenAs,
        };

        this.setOptions(this.rootOptions);
        this.initDomElement(parentDom);
    },

    /**
     * Build the switcher's DOM and wire up its event listeners.
     *
     * @param {HTMLElement} parentDom - Element to append the switcher to.
     */
    initDomElement(parentDom) {
        const signal = this.listenerController.signal;

        this.parentDom = parentDom;
        this.domElement = document.createElement('div');
        this.domElement.className = 'lstr-qswitcher';
        this.domElement.innerHTML = createTemplate(this.idPrefix);
        parentDom.appendChild(this.domElement);

        // Scope every lookup to this instance's element. Querying from the
        // parent would find the first instance's nodes on a page with more
        // than one switcher.
        const find = (selector) => this.domElement.querySelector(selector);

        this.overlay = find('.lstr-qswitcher-overlay');
        this.container = find('.lstr-qswitcher-container');
        this.breadcrumb = find('.lstr-qswitcher-breadcrumb');
        this.closeButton = find('.lstr-qswitcher-close');
        this.search = find('.lstr-qswitcher-search');
        this.loading = find('.lstr-qswitcher-loading');
        this.results = find('.lstr-qswitcher-results');
        this.noSearchTerms = find('.lstr-qswitcher-no-terms');
        this.noResults = find('.lstr-qswitcher-no-results');
        this.oopsResults = find('.lstr-qswitcher-oops-results');

        find('.lstr-qswitcher-popup').addEventListener('submit', (ev) => {
            ev.preventDefault();
        }, {signal});

        this.overlay.addEventListener('click', (ev) => {
            this.closeSwitcher();
            ev.preventDefault();
        }, {signal});

        if (this.hotKey) {
            document.addEventListener('keydown', (ev) => {
                if (!ev.key) {
                    return;
                }

                if (ev[this.modifierKey] && ev.key.toUpperCase() === this.hotKey) {
                    this.toggleSwitcher();
                    ev.preventDefault();
                }
            }, {signal});
        }

        document.addEventListener('keydown', (ev) => {
            if (!this.isOpen || !ev.key) {
                return;
            }

            if (ev.key === 'ArrowUp') {
                this.adjustSelectedIndex(-1);
                ev.preventDefault();
            } else if (ev.key === 'ArrowDown') {
                this.adjustSelectedIndex(1);
                ev.preventDefault();
            } else if (ev.key === 'Escape') {
                this.closeSwitcher();
                ev.preventDefault();
            } else if (ev.key === 'Enter') {
                this.triggerSelect(this.selectedIndex, ev);
                ev.preventDefault();
            }
        }, {signal});

        this.closeButton.addEventListener('click', () => {
            this.closeSwitcher();
        }, {signal});

        this.search.addEventListener('keyup', (ev) => {
            const searchText = this.search.value;

            if (this.searchDelayTimeout) {
                clearTimeout(this.searchDelayTimeout);
                this.searchDelayTimeout = null;
            }

            if (searchText !== this.searchText) {
                this.searchDelayTimeout = setTimeout(() => {
                    this.searchDelayTimeout = null;
                    this.selectIndex(null);
                    this.searchText = searchText;
                    this.renderList();
                }, this.searchDelay);
            } else if (ev.key === 'Backspace' && searchText === '') {
                // Backspace on an empty box steps back out of a nested search.
                if (this.popCallback()) {
                    this.renderList();
                }
            }
        }, {signal});

        const indexFromEvent = (ev) => {
            const li = ev.target.closest
                ? ev.target.closest('.lstr-qswitcher-results li')
                : null;

            if (!li || li.dataset.lstrQswitcherIndex === undefined) {
                return null;
            }

            const index = parseInt(li.dataset.lstrQswitcherIndex, 10);

            return Number.isNaN(index) ? null : index;
        };

        this.domElement.addEventListener('mouseover', (ev) => {
            const index = indexFromEvent(ev);

            if (index !== null) {
                this.selectIndex(index);
            }
        }, {signal});

        this.domElement.addEventListener('touchstart', (ev) => {
            const index = indexFromEvent(ev);

            if (index !== null) {
                this.selectIndex(index);
                this.search.blur();
            }
        }, {signal, passive: true});

        this.domElement.addEventListener('click', (ev) => {
            const index = indexFromEvent(ev);

            if (index !== null) {
                this.triggerSelect(index, ev);
            }
        }, {signal});
    },

    /**
     * Run the active search callback and render whatever it produces.
     */
    renderList() {
        if (this.abortSearchCallback) {
            this.abortSearchCallback();
            this.abortSearchCallback = null;
        }

        this.renderBreadcrumb();
        this.usePane(this.loading);

        const resultHandler = Object.create(ResultHandler);
        ++this.searchId;
        resultHandler.setResults = this.setResults.bind(this, this.searchId);
        resultHandler.setError = this.setError.bind(this, this.searchId);

        try {
            this.abortSearchCallback = this.searchCallback(
                this.searchText,
                resultHandler
            );
        } catch (error) {
            // A throwing search callback should surface the error pane rather
            // than leaving the switcher stuck on "Loading...".
            this.setError(this.searchId, error);
        }
    },

    /**
     * Render a set of results.
     *
     * @param {number} searchId - Search generation, to drop stale responses.
     * @param {Array} items - The results to render.
     */
    setResults(searchId, items) {
        if (searchId !== this.searchId || this.destroyed) {
            return;
        }

        this.valueObjects = [];

        if (!items || items.length === 0) {
            this.results.innerHTML = '';
            this.setActiveDescendant(null);
            this.usePane(this.searchText ? this.noResults : this.noSearchTerms);
            return;
        }

        if (this.options.trackChildrenAs) {
            items = sorters
                .tracker(this.options.trackChildrenAs)
                .sort(items, this.searchText);
        }

        const ul = document.createElement('ul');

        items.forEach((value, index) => {
            const li = document.createElement('li');
            const container = document.createElement('div');

            ul.appendChild(li);
            li.appendChild(container);
            this.setListText(container, value);

            if (value && value.description) {
                const description = document.createElement('span');
                description.className = 'lstr-qswitcher-result-description';
                this.setListText(description, value.description);
                li.insertBefore(description, li.firstChild);
            }

            li.dataset.lstrQswitcherIndex = String(index);
            li.id = `${this.idPrefix}-option-${index}`;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            container.classList.add('lstr-qswitcher-result-container');

            if (value && value.searchCallback) {
                li.classList.add('lstr-qswitcher-result-category');
            }

            this.valueObjects[index] = {index, value, li};
        });

        this.results.innerHTML = '';
        this.results.appendChild(ul);
        this.usePane(this.results);

        this.selectIndex(0);
        this.scrollToSelectedItem();

        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
            window.requestAnimationFrame(() => {
                if (!this.destroyed) {
                    this.scrollToSelectedItem();
                }
            });
        }
    },

    /**
     * Show the error pane for a failed search.
     *
     * @param {number} searchId - Search generation, to drop stale responses.
     */
    setError(searchId) {
        if (searchId !== this.searchId || this.destroyed) {
            return;
        }

        this.valueObjects = [];
        this.setActiveDescendant(null);
        this.usePane(this.oopsResults);
    },

    /**
     * Render the breadcrumb trail for the nested search stack.
     */
    renderBreadcrumb() {
        if (this.callbackStack.length === 0) {
            this.domElement.classList.remove('lstr-qswitcher-subsearch');
            this.breadcrumb.innerHTML = '';
            return;
        }

        const ul = document.createElement('ul');

        this.callbackStack.forEach((entry) => {
            const li = document.createElement('li');
            li.textContent = entry.text;
            ul.appendChild(li);
        });

        this.domElement.classList.add('lstr-qswitcher-subsearch');
        this.breadcrumb.innerHTML = '';
        this.breadcrumb.appendChild(ul);
    },

    /**
     * Write a result's label into an element.
     *
     * `html` is rendered as markup; everything else -- including `text` -- is
     * rendered as plain text, so untrusted result data cannot inject markup.
     *
     * @param {HTMLElement} element - The element to fill.
     * @param {*} value - A string, or an object with `html` or `text`.
     */
    setListText(element, value) {
        if (value && typeof value === 'object') {
            if (value.html !== undefined) {
                element.innerHTML = callbackOrValue(value.html);
                return;
            }

            if (value.text !== undefined) {
                element.textContent = callbackOrValue(value.text);
                return;
            }
        }

        element.textContent = value === null || value === undefined
            ? ''
            : String(value);
    },

    /**
     * Point the search box's aria-activedescendant at the selected option.
     *
     * @param {HTMLElement|null} li - The selected element, or null.
     */
    setActiveDescendant(li) {
        if (li) {
            this.search.setAttribute('aria-activedescendant', li.id);
            return;
        }

        this.search.removeAttribute('aria-activedescendant');
    },

    /**
     * Select a result by index, wrapping around at either end.
     *
     * @param {number|null} selectedIndex - Index to select, or null to clear.
     */
    selectIndex(selectedIndex) {
        const previous = this.selectedIndex !== null
            ? this.valueObjects[this.selectedIndex]
            : null;

        if (previous) {
            previous.li.classList.remove('lstr-qswitcher-result-selected');
            previous.li.setAttribute('aria-selected', 'false');
        }

        if (selectedIndex === null || this.valueObjects.length === 0) {
            this.selectedIndex = null;
            this.setActiveDescendant(null);
            return;
        }

        this.selectedIndex = selectedIndex % this.valueObjects.length;

        if (this.selectedIndex < 0) {
            this.selectedIndex += this.valueObjects.length;
        }

        const current = this.valueObjects[this.selectedIndex];
        current.li.classList.add('lstr-qswitcher-result-selected');
        current.li.setAttribute('aria-selected', 'true');
        this.setActiveDescendant(current.li);
    },

    /**
     * Scroll the results pane so the selected item is visible.
     */
    scrollToSelectedItem() {
        const results = this.results;

        if (this.selectedIndex === null || !this.valueObjects[this.selectedIndex]) {
            results.scrollTop = 0;
            return;
        }

        const li = this.valueObjects[this.selectedIndex].li;

        const topOfLi = li.offsetTop - li.parentElement.offsetTop;
        const bottomOfLi = topOfLi + li.offsetHeight;
        const scrollTop = results.scrollTop;
        const scrollBottom = scrollTop + results.offsetHeight;

        if (bottomOfLi > scrollBottom || topOfLi < scrollTop) {
            results.scrollTop = topOfLi;
        }
    },

    /**
     * Move the selection by a relative amount.
     *
     * @param {number} adjustment - Positions to move; negative moves up.
     */
    adjustSelectedIndex(adjustment) {
        if (this.selectedIndex === null) {
            this.selectIndex(adjustment > 0 ? 0 : -1);
        } else {
            this.selectIndex(this.selectedIndex + adjustment);
        }

        this.scrollToSelectedItem();
    },

    /**
     * Open the switcher if closed, close it if open.
     */
    toggleSwitcher() {
        if (this.isOpen) {
            this.closeSwitcher();
            return;
        }

        this.openSwitcher();
    },

    /**
     * Open the switcher, resetting to the root search.
     */
    openSwitcher() {
        if (this.destroyed || this.isOpen) {
            return;
        }

        this.useRootCallback();
        this.search.value = '';
        this.searchText = '';
        this.renderList();

        this.parentDom.classList.add('lstr-qswitcher-noscroll');
        this.overlay.style.display = 'block';
        this.container.style.display = 'block';
        this.search.setAttribute('aria-expanded', 'true');

        this.isOpen = true;
        this.search.focus();
    },

    /**
     * Close the switcher.
     */
    closeSwitcher() {
        if (this.destroyed || !this.isOpen) {
            return;
        }

        if (this.searchDelayTimeout) {
            clearTimeout(this.searchDelayTimeout);
            this.searchDelayTimeout = null;
        }

        this.parentDom.classList.remove('lstr-qswitcher-noscroll');
        this.overlay.style.display = 'none';
        this.container.style.display = 'none';
        this.search.setAttribute('aria-expanded', 'false');

        this.isOpen = false;
    },

    /**
     * Act on a selected result: drill into a nested search, or select it.
     *
     * @param {number|null} index - Index of the result to act on.
     * @param {Event} event - The DOM event that triggered the selection.
     */
    triggerSelect(index, event) {
        if (index === null || !this.valueObjects[index]) {
            return;
        }

        const selectedValue = this.valueObjects[index].value;
        const selectedResult = Object.create(SelectedResult);
        selectedResult.init(selectedValue, this.searchText, this.options, event);

        if (selectedValue && selectedValue.searchCallback) {
            const isSelectionAllowed = this.selectChildSearchCallback(selectedResult);
            selectedResult.track();

            if (isSelectionAllowed === false) {
                return;
            }

            this.pushState(selectedValue.breadcrumbText);

            // The item itself becomes the active options object, so custom
            // properties on it stay visible to callbacks via
            // selectedResult.parent. Callbacks it does not define are
            // inherited from the search it was reached from.
            this.options = selectedValue;
            this.searchCallback = selectedValue.searchCallback;

            if (selectedValue.searchDelay !== undefined) {
                this.searchDelay = selectedValue.searchDelay;
            }

            if (selectedValue.selectCallback) {
                this.selectCallback = selectedValue.selectCallback;
            }

            if (selectedValue.selectChildSearchCallback) {
                this.selectChildSearchCallback
                    = selectedValue.selectChildSearchCallback;
            }

            if (!selectedResult.isSearchTextClearingPrevented()) {
                this.search.value = '';
                this.searchText = '';
            }

            this.valueObjects = [];
            this.selectIndex(null);
            this.search.focus();
            this.renderList();

            return;
        }

        const isCloseAllowed = this.selectCallback(selectedResult);
        selectedResult.track();

        if (isCloseAllowed !== false) {
            this.closeSwitcher();
        }
    },

    /**
     * Record the current search state before drilling into a nested search.
     *
     * The fully resolved callbacks are captured, not just the options object.
     * Restoring from the options object alone would clear any callback that
     * an intermediate search had inherited rather than declared.
     *
     * @param {string} text - Breadcrumb label for the search being left.
     */
    pushState(text) {
        this.callbackStack.push({
            text,
            options: this.options,
            searchCallback: this.searchCallback,
            searchDelay: this.searchDelay,
            selectCallback: this.selectCallback,
            selectChildSearchCallback: this.selectChildSearchCallback,
        });
    },

    /**
     * Step back out of the current nested search.
     *
     * @returns {boolean} True when there was a search to step out of.
     */
    popCallback() {
        const entry = this.callbackStack.pop();

        if (!entry) {
            return false;
        }

        this.options = entry.options;
        this.searchCallback = entry.searchCallback;
        this.searchDelay = entry.searchDelay;
        this.selectCallback = entry.selectCallback;
        this.selectChildSearchCallback = entry.selectChildSearchCallback;

        return true;
    },

    /**
     * Unwind the nested search stack back to the root search.
     */
    useRootCallback() {
        while (this.popCallback()) {
            // Intentionally empty; popCallback does the work.
        }
    },

    /**
     * Show one pane and hide the rest.
     *
     * @param {HTMLElement} paneToUse - The pane to show.
     */
    usePane(paneToUse) {
        [
            this.results,
            this.noSearchTerms,
            this.noResults,
            this.oopsResults,
            this.loading,
        ].forEach((pane) => {
            pane.style.display = 'none';
        });

        paneToUse.style.display = 'block';
    },

    /**
     * Swap in a new set of active callbacks.
     *
     * @param {Object} options - The options to activate.
     */
    setOptions(options) {
        this.options = options;

        this.searchCallback = options.searchCallback;
        this.searchDelay = options.searchDelay;
        this.selectCallback = options.selectCallback;
        this.selectChildSearchCallback = options.selectChildSearchCallback;
    },

    /**
     * Detach every listener, remove the switcher's DOM, and render this
     * instance inert. Safe to call more than once.
     */
    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        if (this.searchDelayTimeout) {
            clearTimeout(this.searchDelayTimeout);
            this.searchDelayTimeout = null;
        }

        if (this.abortSearchCallback) {
            this.abortSearchCallback();
            this.abortSearchCallback = null;
        }

        this.listenerController.abort();

        this.parentDom.classList.remove('lstr-qswitcher-noscroll');

        if (this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }

        this.valueObjects = [];
        this.selectedIndex = null;
        this.isOpen = false;
    },
};

/**
 * Create a quick switcher.
 *
 * @param {Object} [options] - Configuration options.
 * @param {Function} [options.searchCallback] - Produces results for a query.
 * @param {Function} [options.selectCallback] - Runs when a result is chosen.
 * @param {Function} [options.selectChildSearchCallback] - Runs when a nested
 *     search is entered.
 * @param {number} [options.searchDelay=1000] - Debounce in milliseconds.
 * @param {string|null} [options.hotKey='K'] - Key used with Cmd/Ctrl to open,
 *     or null to disable the hotkey entirely.
 * @param {string} [options.trackChildrenAs] - Tracker name enabling
 *     usage-based ranking of this search's results.
 * @param {HTMLElement} [options.parentDom=document.body] - Host element.
 * @returns {{open: Function, close: Function, toggle: Function,
 *     destroy: Function, isOpen: Function}} The switcher's public API.
 */
export const lstrQuickSwitcher = (options = {}) => {
    const parentDom = options.parentDom || document.body;

    const quickSwitcher = Object.create(QuickSwitcher);
    quickSwitcher.init(parentDom, options);

    return {
        open: () => quickSwitcher.openSwitcher(),
        close: () => quickSwitcher.closeSwitcher(),
        toggle: () => quickSwitcher.toggleSwitcher(),
        destroy: () => quickSwitcher.destroy(),
        isOpen: () => quickSwitcher.isOpen,
    };
};

export default lstrQuickSwitcher;
