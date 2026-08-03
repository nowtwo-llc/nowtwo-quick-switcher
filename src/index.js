/**
 * Package entry point.
 *
 * Only a default export is declared, so the UMD build's global
 * (`window.lstrQuickSwitcher`) stays directly callable exactly as it was in
 * previous versions. The filter and sorter helpers hang off that function for
 * consumers who want them outside a search callback -- inside one they are
 * already available as `resultHandler.filters` and `resultHandler.sorters`.
 */

/**
 * Re-exported so consumers can `import type { SearchCallback } from
 * '@nowtwo-llc/quick-switcher'` rather than reaching into a subpath. These
 * aliases are what put the names in the generated `index.d.ts`.
 *
 * @typedef {import('./types.js').TextValue} TextValue
 * @typedef {import('./types.js').ResultDescription} ResultDescription
 * @typedef {import('./types.js').Filters} Filters
 * @typedef {import('./types.js').Tracker} Tracker
 * @typedef {import('./types.js').Sorters} Sorters
 * @typedef {import('./types.js').ResultHandler} ResultHandler
 * @typedef {import('./types.js').SearchCallback} SearchCallback
 * @typedef {import('./types.js').SelectCallback} SelectCallback
 * @typedef {import('./types.js').SelectChildSearchCallback} SelectChildSearchCallback
 * @typedef {import('./types.js').ResultItem} ResultItem
 * @typedef {import('./types.js').ResultInput} ResultInput
 * @typedef {import('./types.js').SelectedResult} SelectedResult
 * @typedef {import('./types.js').QuickSwitcherOptions} QuickSwitcherOptions
 * @typedef {import('./types.js').QuickSwitcherInstance} QuickSwitcherInstance
 * @typedef {import('./types.js').QuickSwitcherFactory} QuickSwitcherFactory
 */

import lstrQuickSwitcher from './quick-switcher.js';
import filters from './filters.js';
import sorters from './sorters.js';

// The cast is what lets `tsc` describe the export as callable *and* carrying
// the helpers. Assigning the properties below is a runtime mutation that type
// inference alone reports as a plain function.
const factory = /** @type {import('./types.js').QuickSwitcherFactory} */ (lstrQuickSwitcher);

factory.filters = filters;
factory.sorters = sorters;

export default factory;
