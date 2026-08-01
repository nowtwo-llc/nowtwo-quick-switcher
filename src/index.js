/**
 * Package entry point.
 *
 * Only a default export is declared, so the UMD build's global
 * (`window.lstrQuickSwitcher`) stays directly callable exactly as it was in
 * previous versions. The filter and sorter helpers hang off that function for
 * consumers who want them outside a search callback -- inside one they are
 * already available as `resultHandler.filters` and `resultHandler.sorters`.
 */

import lstrQuickSwitcher from './quick-switcher.js';
import filters from './filters.js';
import sorters from './sorters.js';

lstrQuickSwitcher.filters = filters;
lstrQuickSwitcher.sorters = sorters;

export default lstrQuickSwitcher;
