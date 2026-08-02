/**
 * Type definitions for @nowtwollc/quick-switcher.
 *
 * Hand-written rather than generated: the generated output typed every
 * callback as `Function`, which told consumers nothing useful.
 */

export type TextValue = string | (() => string);

/** A description line, as plain text or as markup. */
export interface ResultDescription {
    /** Rendered as plain text. */
    text?: TextValue;
    /** Rendered as markup. Not sanitized. */
    html?: TextValue;
}

/** Search matching helpers, available on the result handler. */
export interface Filters {
    /**
     * True when the needle is a substring of the haystack, or when every word
     * in the needle appears in it. Case-insensitive.
     */
    isMatch(needle: string, haystack: unknown): boolean;

    /** True when every word in the needle appears in the haystack. */
    areWordsFound(needle: string, haystack: unknown): boolean;
}

/** A usage tracker, keyed by tracker name. */
export interface Tracker {
    /** Rank items by usage. Returns a new array; the input is untouched. */
    sort<T extends ResultInput>(items: T[], searchText: string): T[];

    /** Record a selection. The item needs a `trackerId` to be recorded. */
    trackSelection(item: ResultItem, searchText: string): void;

    /** The usage score for an item, or 0 when it is untracked. */
    scoreSelection(item: ResultItem, searchText: string): number;

    /** Forget every selection recorded against this tracker. */
    reset(): void;
}

/** Sorting helpers, available on the result handler. */
export interface Sorters {
    tracker(trackerName: string): Tracker;
}

/** Passed to every search callback. */
export interface ResultHandler {
    /** Render these results. */
    setResults(items: ResultInput[]): void;

    /** Show the error pane. */
    setError(): void;

    filters: Filters;
    sorters: Sorters;
}

/**
 * Produces results for a query. Return a function to have it called if the
 * query changes before the search resolves.
 */
export type SearchCallback = (
    searchText: string,
    resultHandler: ResultHandler,
) => (() => void) | void;

/** Return `false` to keep the switcher open after a selection. */
export type SelectCallback = (selected: SelectedResult) => boolean | void;

/** Return `false` to block entry into a nested search. */
export type SelectChildSearchCallback = (
    selected: SelectedResult,
) => boolean | void;

/** A result object. Custom properties are preserved and passed through. */
export interface ResultItem {
    /** Label, rendered as plain text. */
    text?: TextValue;

    /** Label, rendered as markup. Takes precedence over `text`. */
    html?: TextValue;

    /** Secondary line. */
    description?: string | ResultDescription;

    /** Providing this makes the result a nested search. */
    searchCallback?: SearchCallback;

    /** Breadcrumb label for the nested search. */
    breadcrumbText?: string;

    /** Identity for usage tracking. Required for the result to be ranked. */
    trackerId?: string;

    /** Hard ordering applied before usage score. Lower comes first. */
    trackerStaticSort?: number;

    /** Overrides the debounce inside a nested search. */
    searchDelay?: number;

    /** Overrides the select handler inside a nested search. */
    selectCallback?: SelectCallback;

    /** Overrides the child-search handler inside a nested search. */
    selectChildSearchCallback?: SelectChildSearchCallback;

    /** Tracker name for a nested search's own results. */
    trackChildrenAs?: string;

    [key: string]: unknown;
}

/** A result is either a bare string or a result object. */
export type ResultInput = string | ResultItem;

/** Passed to select callbacks. */
export interface SelectedResult {
    /** The result that was chosen. */
    selectedValue: ResultInput;

    /** The query active at selection time. */
    searchText: string;

    /** The options object, or parent item, the result came from. */
    parent: QuickSwitcherOptions | ResultItem;

    /** The DOM event that triggered the selection. */
    domEvent: Event;

    /** Do not record this selection against the tracker. */
    preventTracking(): void;

    /** Keep the query when entering a nested search. */
    preventSearchTextClearing(): void;

    isSearchTextClearingPrevented(): boolean;
}

export interface QuickSwitcherOptions {
    searchCallback?: SearchCallback;
    selectCallback?: SelectCallback;
    selectChildSearchCallback?: SelectChildSearchCallback;

    /** Debounce in milliseconds. Defaults to 1000. */
    searchDelay?: number;

    /** Key used with Cmd/Ctrl to open. `null` disables the hotkey. */
    hotKey?: string | null;

    /** Tracker name enabling usage-based ranking of this search's results. */
    trackChildrenAs?: string;

    /** Element to mount into. Defaults to `document.body`. */
    parentDom?: HTMLElement;
}

export interface QuickSwitcherInstance {
    /** Open, resetting to the root search. */
    open(): void;

    /** Close. */
    close(): void;

    /** Open if closed, close if open. */
    toggle(): void;

    /** Whether the switcher is currently open. */
    isOpen(): boolean;

    /** Detach all listeners and remove the element. Safe to call twice. */
    destroy(): void;
}

export interface QuickSwitcherFactory {
    (options?: QuickSwitcherOptions): QuickSwitcherInstance;
    filters: Filters;
    sorters: Sorters;
}

declare const lstrQuickSwitcher: QuickSwitcherFactory;

export default lstrQuickSwitcher;
