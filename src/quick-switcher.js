/**
 * Quick Switcher Module
 * A keyboard-driven interface for quickly switching between different views or actions
 * in the application. Similar to VS Code's command palette or Sublime Text's Goto Anything.
 */

const quickSwitcher = (filters, SelectedResult, sorters, html) => {
    /**
     * Result Handler
     * Manages the filtering and sorting of search results
     */
    const ResultHandler = {
        filters: filters,
        sorters: sorters,
    };

    /**
     * Helper function to handle both function and value callbacks
     * @param {*} value - Either a function or a direct value
     * @returns {*} The result of the function call or the value itself
     */
    const callbackOrValue = (value) => (typeof value === 'function') ? value() : value;

    /**
     * Main QuickSwitcher object that handles all the functionality
     */
    const QuickSwitcher = {
        /**
         * Initialize the QuickSwitcher
         * @param {HTMLElement} parentDom - The parent DOM element to attach to
         * @param {Object} options - Configuration options
         */
        init(parentDom, options) {
            // Initialize state variables
            this.isOpen = false;
            this.parentDom = null;
            this.liCollection = null;
            this.valueObjects = null;
            this.selectedIndex = null;
            this.results = null;
            this.noSearchTerms = null;
            this.noResults = null;
            this.loading = null;
            this.breadcrumb = null;
            this.search = null;
            this.searchText = '';
            this.searchDelayTimeout = null;
            this.searchId = 0;

            // Set modifier key based on platform (Ctrl for Windows/Linux, Cmd for Mac)
            this.modifierKey = 'ctrlKey';
            if (navigator.platform.toLowerCase().includes('mac')) {
                this.modifierKey = 'metaKey';
            }

            // Set default options and merge with provided options
            options = Object.assign({
                searchCallback: () => {},
                selectCallback: () => {},
                selectChildSearchCallback: () => {},
                searchDelay: 1000,
                hotKey: 'K',
            }, options);

            // Set hotkey if provided
            if (options.hotKey) {
                this.hotKey = options.hotKey.toUpperCase();
            }

            // Initialize options
            this.setOptions({
                searchCallback: options.searchCallback,
                selectCallback: options.selectCallback,
                selectChildSearchCallback: options.selectChildSearchCallback,
                searchDelay: options.searchDelay,
                trackChildrenAs: options.trackChildrenAs,
            });

            // Initialize DOM elements
            this.initDomElement(parentDom);

            // Initialize callback stack and abort search callback
            this.callbackStack = [];
            this.abortSearchCallback = null;
        },

        /**
         * Initialize DOM elements and set up event listeners
         * @param {HTMLElement} parentDom - The parent DOM element
         */
        initDomElement(parentDom) {
            const qSwitcher = this;

            // Store parent DOM and create main element
            this.parentDom = parentDom;
            this.domElement = document.createElement('div');
            this.domElement.innerHTML = html;
            parentDom.appendChild(this.domElement);

            // Cache DOM elements
            this.breadcrumb = this.domElement.querySelector('.lstr-qswitcher-breadcrumb');
            this.close = this.domElement.querySelector('.lstr-qswitcher-close');
            this.search = this.domElement.querySelector('.lstr-qswitcher-search');
            this.loading = this.domElement.querySelector('.lstr-qswitcher-loading');
            this.results = this.domElement.querySelector('.lstr-qswitcher-results');
            this.noSearchTerms = this.domElement.querySelector('.lstr-qswitcher-no-terms');
            this.noResults = this.domElement.querySelector('.lstr-qswitcher-no-results');
            this.oopsResults = this.domElement.querySelector('.lstr-qswitcher-oops-results');

            const domElement = this.domElement;

            // Prevent form submission
            domElement.querySelector('.lstr-qswitcher-popup').addEventListener('submit', (ev) => {
                ev.preventDefault();
            });

            // Close on overlay click
            parentDom.querySelector('.lstr-qswitcher-overlay').addEventListener('click', (ev) => {
                qSwitcher.closeSwitcher();
                ev.preventDefault();
            });

            // Handle keyboard shortcuts
            parentDom.addEventListener('keydown', (ev) => {
                if (ev[qSwitcher.modifierKey] && ev.key.toUpperCase() === qSwitcher.hotKey) {
                    qSwitcher.toggleSwitcher();
                    ev.preventDefault();
                }
            });

            // Handle navigation keys when switcher is open
            document.documentElement.addEventListener('keydown', (ev) => {
                if (!qSwitcher.isOpen) {
                    return;
                }

                if (ev.key === 'ArrowUp') {
                    qSwitcher.adjustSelectedIndex(-1);
                    ev.preventDefault();
                } else if (ev.key === 'ArrowDown') {
                    qSwitcher.adjustSelectedIndex(1);
                    ev.preventDefault();
                } else if (ev.key === 'Escape') {
                    qSwitcher.closeSwitcher();
                    ev.preventDefault();
                } else if (ev.key === 'Enter') {
                    qSwitcher.triggerSelect(qSwitcher.selectedIndex, ev);
                    ev.preventDefault();
                }
            });

            // Close button handler
            this.close.addEventListener('click', () => {
                qSwitcher.closeSwitcher();
            });

            // Search input handler
            this.search.addEventListener('keyup', (ev) => {
                const searchText = qSwitcher.search.value;
                if (qSwitcher.searchDelayTimeout) {
                    clearTimeout(qSwitcher.searchDelayTimeout);
                    qSwitcher.searchDelayTimeout = null;
                }

                if (searchText !== qSwitcher.searchText) {
                    qSwitcher.searchDelayTimeout = setTimeout(() => {
                        qSwitcher.selectIndex(null);
                        qSwitcher.searchText = searchText;
                        qSwitcher.renderList();
                    }, qSwitcher.searchDelay);
                } else if (ev.key === 'Backspace' && '' === searchText) {
                    // Handle backspace with empty search
                    qSwitcher.popCallback();
                    qSwitcher.renderList();
                }
            });

            // Mouse over handler for results
            domElement.addEventListener('mouseover', (ev) => {
                const li = ev.target.closest('.lstr-qswitcher-results li');
                if (li) {
                    const dataset = JSON.parse(li.getAttribute('data-lstr-qswitcher'));
                    if (dataset) {
                        qSwitcher.selectIndex(dataset.index);
                    }
                }
            });

            // Touch handler for results
            domElement.addEventListener('touchstart', (ev) => {
                const li = ev.target.closest('.lstr-qswitcher-results li');
                if (li) {
                    const dataset = JSON.parse(li.getAttribute('data-lstr-qswitcher'));
                    if (dataset) {
                        qSwitcher.selectIndex(dataset.index);
                        qSwitcher.search.blur();
                    }
                }
            });

            // Click handler for results
            domElement.addEventListener('click', (ev) => {
                const li = ev.target.closest('.lstr-qswitcher-results li');
                if (li) {
                    const dataset = JSON.parse(li.getAttribute('data-lstr-qswitcher'));
                    if (dataset) {
                        qSwitcher.triggerSelect(dataset.index, ev);
                    }
                }
            });
        },

        /**
         * Render the search results list
         */
        renderList() {
            // Abort any existing search
            if (this.abortSearchCallback) {
                this.abortSearchCallback();
                this.abortSearchCallback = null;
            }

            this.renderBreadcrumb();
            this.usePane(this.loading);

            // Create result handler and initiate search
            const resultHandler = Object.create(ResultHandler);
            ++this.searchId;
            resultHandler.setResults = this.setResults.bind(this, this.searchId);
            resultHandler.setError = this.setError.bind(this, this.searchId);
            this.abortSearchCallback = this.searchCallback(
                this.searchText,
                resultHandler
            );
        },

        /**
         * Set the search results
         * @param {number} searchId - The ID of the current search
         * @param {Array} items - The search results
         */
        setResults(searchId, items) {
            if (searchId !== this.searchId) {
                return;
            }

            const qSwitcher = this;
            qSwitcher.valueObjects = [];

            // Handle empty results
            if (items.length === 0) {
                this.results.innerHTML = '';
                this.usePane(this.searchText ? this.noResults : this.noSearchTerms);
                return;
            }

            // Create results list
            const ul = document.createElement('ul');

            // Sort items if tracking is enabled
            if (this.options.trackChildrenAs) {
                const tracker = sorters.tracker(this.options.trackChildrenAs);
                items = tracker.sort(items, this.searchText);
            }

            // Create list items for each result
            items.forEach((value, index) => {
                const li = document.createElement('li');
                const container = document.createElement('div');
                ul.appendChild(li);
                li.appendChild(container);
                qSwitcher.setListText(container, value);

                // Add description if available
                if (value.description) {
                    const description = document.createElement('span');
                    description.className = 'lstr-qswitcher-result-description';
                    qSwitcher.setListText(description, value.description);
                    li.insertBefore(description, li.firstChild);
                }

                // Set data attributes and classes
                li.dataset.lstrQswitcher = JSON.stringify({'index': index});
                container.classList.add('lstr-qswitcher-result-container');

                if (value.searchCallback) {
                    li.classList.add('lstr-qswitcher-result-category');
                }

                // Store value object
                qSwitcher.valueObjects[index] = {
                    'index': index,
                    'value': value,
                    'li': li,
                };
            });

            // Update DOM
            this.results.innerHTML = '';
            this.results.appendChild(ul);
            this.usePane(this.results);

            // Select first item and scroll
            qSwitcher.selectIndex(0);
            qSwitcher.scrollToSelectedItem();
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(() => {
                    qSwitcher.scrollToSelectedItem();
                });
            }
        },

        /**
         * Handle search errors
         * @param {number} searchId - The ID of the current search
         */
        setError(searchId) {
            if (searchId !== this.searchId) {
                return;
            }
            this.usePane(this.oopsResults);
        },

        /**
         * Render the breadcrumb navigation
         */
        renderBreadcrumb() {
            if (this.callbackStack.length === 0) {
                this.domElement.classList.remove('lstr-qswitcher-subsearch');
                this.breadcrumb.innerHTML = '';
                return;
            }

            const ul = document.createElement('ul');

            this.callbackStack.forEach((value, index) => {
                const li = document.createElement('li');
                li.textContent = value.text;
                ul.appendChild(li);
            });

            this.domElement.classList.add('lstr-qswitcher-subsearch');
            this.breadcrumb.innerHTML = '';
            this.breadcrumb.appendChild(ul);
        },

        /**
         * Set the text content of a list element
         * @param {HTMLElement} element - The element to set text for
         * @param {*} value - The value to set
         */
        setListText(element, value) {
            if (value.html) {
                element.innerHTML = callbackOrValue(value.html);
                return;
            }

            if (value.text) {
                element.innerHTML = callbackOrValue(value.text);
                return;
            }

            element.textContent = value;
        },

        /**
         * Select an item by index
         * @param {number} selectedIndex - The index to select
         */
        selectIndex(selectedIndex) {
            if (this.selectedIndex !== null
                && this.valueObjects[this.selectedIndex]
            ) {
                this.valueObjects[this.selectedIndex]
                    .li.classList.remove('lstr-qswitcher-result-selected');
            }

            if (null === selectedIndex || 0 === this.valueObjects.length) {
                this.selectedIndex = null;
                return;
            }

            this.selectedIndex = selectedIndex % this.valueObjects.length;

            if (this.selectedIndex < 0) {
                this.selectedIndex = this.valueObjects.length - 1;
            }

            this.valueObjects[this.selectedIndex]
                .li.classList.add('lstr-qswitcher-result-selected');
        },

        /**
         * Scroll to the selected item
         */
        scrollToSelectedItem() {
            const results = this.results;

            if (this.selectedIndex === null) {
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
         * Adjust the selected index
         * @param {number} adjustment - The amount to adjust by
         */
        adjustSelectedIndex(adjustment) {
            this.selectIndex(this.selectedIndex + adjustment);
            this.scrollToSelectedItem();
        },

        /**
         * Toggle the switcher open/closed
         */
        toggleSwitcher() {
            if (this.isOpen) {
                this.closeSwitcher();
                return;
            }
            return this.openSwitcher();
        },

        /**
         * Open the switcher
         */
        openSwitcher() {
            this.useRootCallback();
            this.search.value = '';
            this.searchText = '';
            this.renderList();

            this.parentDom.classList.toggle('lstr-qswitcher-noscroll');
            this.domElement.querySelector('.lstr-qswitcher-overlay').style.display = 'block';
            this.domElement.querySelector('.lstr-qswitcher-container').style.display = 'block';

            this.isOpen = true;
            this.search.focus();
        },

        /**
         * Close the switcher
         */
        closeSwitcher() {
            this.parentDom.classList.remove('lstr-qswitcher-noscroll');
            this.domElement.querySelector('.lstr-qswitcher-overlay').style.display = 'none';
            this.domElement.querySelector('.lstr-qswitcher-container').style.display = 'none';

            this.isOpen = false;
        },

        /**
         * Handle selection of an item
         * @param {number} index - The index of the selected item
         * @param {Event} event - The triggering event
         */
        triggerSelect(index, event) {
            if (null === index) {
                return;
            }

            const selectedValue = this.valueObjects[index].value;
            const selectedResult = Object.create(SelectedResult);
            selectedResult.init(selectedValue, this.searchText, this.options, event);

            if (selectedValue.searchCallback) {
                const isSelectionAllowed = this.selectChildSearchCallback(selectedResult);
                selectedResult.track();
                if (false === isSelectionAllowed) {
                    return;
                }

                this.callbackStack.push({
                    'text': selectedValue.breadcrumbText,
                    'parent': this.options,
                });

                this.options = selectedValue;
                this.searchCallback = selectedValue.searchCallback;
                if (selectedValue.searchDelay) {
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
            if (false !== isCloseAllowed) {
                this.closeSwitcher();
            }
        },

        /**
         * Pop the last callback from the stack
         * @returns {boolean} Whether a callback was popped
         */
        popCallback() {
            const callbacks = this.callbackStack.pop();
            if (!callbacks) {
                return false;
            }

            this.setOptions(callbacks.parent);

            return true;
        },

        /**
         * Reset to root callback
         */
        useRootCallback() {
            while (this.callbackStack.length > 0) {
                this.popCallback();
            }
        },

        /**
         * Switch to a different pane
         * @param {HTMLElement} paneToUse - The pane to show
         */
        usePane(paneToUse) {
            this.results.style.display = 'none';
            this.noSearchTerms.style.display = 'none';
            this.noResults.style.display = 'none';
            this.oopsResults.style.display = 'none';
            this.loading.style.display = 'none';

            paneToUse.style.display = 'block';
        },

        /**
         * Set the options
         * @param {Object} options - The options to set
         */
        setOptions(options) {
            this.options = options;

            this.searchCallback = options.searchCallback;
            this.searchDelay = options.searchDelay;
            this.selectCallback = options.selectCallback;
            this.selectChildSearchCallback = options.selectChildSearchCallback;
        },
    };

    /**
     * Create and return a new QuickSwitcher instance
     * @param {Object} options - Configuration options
     * @returns {Object} The QuickSwitcher instance
     */
    const lstrQuickSwitcher = (options) => {
        const parentDom = document.body;

        const quickSwitcher = Object.create(QuickSwitcher);
        quickSwitcher.init(parentDom, options);

        return {
            open: quickSwitcher.openSwitcher.bind(quickSwitcher),
        };
    };

    return lstrQuickSwitcher;
};

// Define the module
define(
    'quick-switcher',
    ['filters', 'selected-result', 'sorters', 'text!quick-switcher.html'],
    quickSwitcher
);