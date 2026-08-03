/**
 * Public type surface, defined as JSDoc so `tsc` can generate the published
 * declarations from source rather than from a hand-maintained `.d.ts`.
 *
 * This module has no runtime content — it exists only to carry the typedefs.
 * Reference them from other files with `import('./types.js').TypeName`.
 */

/**
 * A string, or a function returning one, so labels can be computed lazily.
 *
 * @typedef {string | (() => string)} TextValue
 */

/**
 * A description line, as plain text or as markup.
 *
 * @typedef {Object} ResultDescription
 * @property {TextValue} [text] - Rendered as plain text.
 * @property {TextValue} [html] - Rendered as markup. Not sanitized.
 */

/**
 * Search matching helpers, available on the result handler.
 *
 * @typedef {Object} Filters
 * @property {(needle: string, haystack: unknown) => boolean} isMatch - True when
 *     the needle is a substring of the haystack, or when every word in the
 *     needle appears in it. Case-insensitive.
 * @property {(needle: string, haystack: unknown) => boolean} areWordsFound -
 *     True when every word in the needle appears in the haystack.
 */

/**
 * A usage tracker, keyed by tracker name.
 *
 * @typedef {Object} Tracker
 * @property {<T extends ResultInput>(items: T[], searchText: string) => T[]} sort -
 *     Rank items by usage. Returns a new array; the input is untouched.
 * @property {(item: ResultItem, searchText: string) => void} trackSelection -
 *     Record a selection. The item needs a `trackerId` to be recorded.
 * @property {(item: ResultItem, searchText: string) => number} scoreSelection -
 *     The usage score for an item, or 0 when it is untracked.
 * @property {() => void} reset - Forget every selection recorded against this tracker.
 */

/**
 * Sorting helpers, available on the result handler.
 *
 * @typedef {Object} Sorters
 * @property {(trackerName: string) => Tracker} tracker - Get a named usage tracker.
 */

/**
 * Passed to every search callback.
 *
 * @typedef {Object} ResultHandler
 * @property {(items: ResultInput[]) => void} setResults - Render these results.
 * @property {() => void} setError - Show the error pane.
 * @property {Filters} filters
 * @property {Sorters} sorters
 */

/**
 * Produces results for a query. Return a function to have it called if the
 * query changes before the search resolves.
 *
 * @callback SearchCallback
 * @param {string} searchText - The current query.
 * @param {ResultHandler} resultHandler - Sink for results, plus helpers.
 * @returns {(() => void) | void} Optional cancellation function.
 */

/**
 * Runs when a result is chosen. Return `false` to keep the switcher open.
 *
 * @callback SelectCallback
 * @param {SelectedResult} selected - The chosen result and its context.
 * @returns {boolean | void}
 */

/**
 * Runs when a nested search is entered. Return `false` to block entry.
 *
 * @callback SelectChildSearchCallback
 * @param {SelectedResult} selected - The chosen result and its context.
 * @returns {boolean | void}
 */

/**
 * A result object. Custom properties are preserved and passed through, which is
 * why this intersects `Record<string, unknown>`.
 *
 * @typedef {{
 *     text?: TextValue,
 *     html?: TextValue,
 *     description?: string | ResultDescription,
 *     searchCallback?: SearchCallback,
 *     breadcrumbText?: string,
 *     trackerId?: string,
 *     trackerStaticSort?: number,
 *     searchDelay?: number,
 *     selectCallback?: SelectCallback,
 *     selectChildSearchCallback?: SelectChildSearchCallback,
 *     trackChildrenAs?: string
 * } & Record<string, unknown>} ResultItem
 */

/**
 * A result is either a bare string or a result object.
 *
 * @typedef {string | ResultItem} ResultInput
 */

/**
 * Passed to select callbacks.
 *
 * @typedef {Object} SelectedResult
 * @property {ResultInput} selectedValue - The result that was chosen.
 * @property {string} searchText - The query active at selection time.
 * @property {QuickSwitcherOptions | ResultItem} parent - The options object, or
 *     parent item, the result came from.
 * @property {Event} domEvent - The DOM event that triggered the selection.
 * @property {() => void} preventTracking - Do not record this selection.
 * @property {() => void} preventSearchTextClearing - Keep the query when
 *     entering a nested search.
 * @property {() => boolean} isSearchTextClearingPrevented
 */

/**
 * Configuration for a switcher.
 *
 * @typedef {Object} QuickSwitcherOptions
 * @property {SearchCallback} [searchCallback] - Produces results for a query.
 * @property {SelectCallback} [selectCallback] - Runs when a result is chosen.
 * @property {SelectChildSearchCallback} [selectChildSearchCallback] - Runs when
 *     a nested search is entered.
 * @property {number} [searchDelay=1000] - Debounce in milliseconds.
 * @property {string | null} [hotKey='K'] - Key used with Cmd/Ctrl to open, or
 *     `null` to disable the hotkey entirely.
 * @property {string} [trackChildrenAs] - Tracker name enabling usage-based
 *     ranking of this search's results.
 * @property {HTMLElement} [parentDom=document.body] - Host element.
 */

/**
 * The object returned by the factory.
 *
 * @typedef {Object} QuickSwitcherInstance
 * @property {() => void} open - Open, resetting to the root search.
 * @property {() => void} close - Close.
 * @property {() => void} toggle - Open if closed, close if open.
 * @property {() => boolean} isOpen - Whether the switcher is currently open.
 * @property {() => void} destroy - Detach all listeners and remove the element.
 *     Safe to call twice.
 */

/**
 * The default export: callable, with the helpers hung off it.
 *
 * @typedef {((options?: QuickSwitcherOptions) => QuickSwitcherInstance) & {
 *     filters: Filters,
 *     sorters: Sorters
 * }} QuickSwitcherFactory
 */

export {};
