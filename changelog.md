# Change Log

This project follows [semantic versioning](https://semver.org/).

## v4.0.0

The modernization release: the package is renamed, the source is ESM, and the
repository is public.

### Breaking

- **Renamed to `@nowtwollc/quick-switcher`** (was
  `@nowtwo-llc/quick-switcher`), and **published to npmjs.com** rather
  than a private registry. Installing no longer requires a registry mapping or
  an auth token.
- **`text` is rendered as plain text.** It was previously written through
  `innerHTML` despite being documented as text, which let untrusted result data
  inject markup. Move any markup you were passing in `text` to `html`.
- **`filters.isMatch` and `filters.areWordsFound` are case-insensitive.**
  Searches that relied on case-sensitive matching will now match more broadly.
- **`filters.areWordsFound` returns `false` for a needle with no words.** It
  previously threw a `TypeError` on punctuation-only input.
- **Distribution layout changed.** The ESM build is `dist/quick-switcher.esm.js`
  and type declarations are generated. The UMD build keeps its
  `dist/quick-switcher.min.js` path and its `lstrQuickSwitcher` global, so
  `<script>` consumers are unaffected.
- **`dist/` is no longer committed.** It is built on publish.
- Requires Node 20+ to build. There is no Node requirement to *use* the library.
- The close control is a `<button>` rather than an `<a href="#">`.
- The internal `data-lstr-qswitcher` attribute is now
  `data-lstr-qswitcher-index` and holds a bare integer.

### Added

- `close()`, `toggle()`, `isOpen()`, and `destroy()` on the instance API.
  `destroy()` removes the document-level hotkey and navigation listeners, which
  previously leaked for the lifetime of the page.
- `parentDom` option, for mounting somewhere other than `document.body`.
- ESM entry point, an `exports` map, and generated TypeScript declarations.
- `tracker.reset()` for clearing tracked selections.
- ARIA combobox semantics: `role`, `aria-expanded`, `aria-activedescendant`,
  and `aria-selected` are maintained as the selection moves.

### Fixed

- Multiple instances on one page no longer collide. Element IDs are namespaced
  per instance, and each instance queries only within its own subtree — it
  previously resolved `.lstr-qswitcher-overlay` from the shared parent and found
  the first instance's node.
- Stepping back out of a nested search restores the callbacks that search had
  *inherited*, not just the ones it declared. Backing out of two levels could
  previously leave `selectCallback` undefined and throw on the next selection.
- `tracker.sort()` no longer mutates the caller's array or writes a temporary
  `_qswitcher` property onto result objects.
- Corrupt or unwritable `localStorage` no longer breaks the switcher. A bad
  stored value used to throw from `JSON.parse` on every open.
- Per-search-term statistics stored under a non-canonical key are recovered
  instead of silently resetting.
- A `searchCallback` that throws shows the error pane instead of leaving the
  switcher stuck on "Loading...".
- Opening an already-open switcher no longer unlocks page scrolling.
- `navigator.platform`, which is deprecated, is no longer used for platform
  detection; iPadOS and iOS are now detected correctly.
- Malformed persisted tracker data is tolerated rather than throwing.

### Changed

- Source converted from AMD to ES modules; built with Vite instead of the
  RequireJS optimizer, Almond, and Terser.
- The HTML template is inlined, removing the `requirejs/text` loader plugin —
  and with it the package's only git-URL dependency.
- Tests moved from tape to Vitest with jsdom, from 3 assertions to full
  coverage of the tracker, filters, storage, and DOM lifecycle.
- CI moved from Travis to GitHub Actions (Node 20/22/24).
- The Jekyll documentation site was replaced with a static demo page built by
  Vite and deployed to GitHub Pages.
- Relicensed clearly as MIT. The package previously declared `UNLICENSED` while
  shipping an MIT `LICENSE` file.
- Word matching tokenizes unicode letters and numbers, so non-English terms
  split into words the same way English ones do.

## v3.0.0 — 2026-01-28

- Dependency updates and a general code cleanup.

## v2.0.1 — 2025-06-19

- Removed the jQuery dependency entirely.
- Modernized the codebase.

## v1.2.0 — 2023-07-27

- Style updates.

## v1.1.0 — 2023-06-02

- Dependency updates and minor enhancements.

## v1.0.0 — 2019-03-15

- First release under the nowtwo-llc fork, adapted from Matt Light's
  original quick switcher.

---

The releases below predate this fork and describe Matt Light's original
project.

## v0.4.0

 - Update docs to use Jekyll for SCSS compiling
 - Remove `dist` directory
 - Allow hot key to be disabled by allowing the hot key to be set to null

## v0.3.0

Backwards breaking changes and steps for migrating to v0.3.0:
 - Make tracking recently used selections as easy as setting a config value
     1. Add `trackChildrenAs` property to root element or parent search item
     2. Remove calls to `tracker().sort()` and `selected.trackAs()`—these calls are now handled automatically
 - Switch style sheets source to use SCSS and add CSS dist file to build process
     1. Copy the CSS file from quick-switcher.tar.gz instead of referencing the `src` (also, keep in mind that the committed `dist` directory may go away soon)
 - Remove unused `isFuzzyMatch` function
     1. Rely on your own fuzzy-match method instead :) Feel free to copy `isFuzzyMatch` logic from the quick-switcher git history

Other changes:
 - Add distribution tarball with compiled JS & CSS assets to GitHub releases
 - Use `yarn` to lock dependency versions

## v0.2.0

 - Fix selected item's lack of highlight
 - Reset scroll to 0 when changing search callbacks
 - Re-focus search input after changing search callbacks
 - Make quick-switcher mobile friendly
 - Make it possible to manually trigger the opening of the quick switcher
 - Allow statically sorted items, bypassing tracker
 - Rename result description CSS class

## v0.1.0

 - Limit hotkey to be platform-specific (Cmd only on Mac, Ctrl on other platforms)
 - Add ability to track selection frequency of items
 - Add callback for selection of child-search items
 - Use almond to load dependencies and minify
 - Rename `subtext` to `description`
   - `description` is now treated as text by default
   - Use an object with an `html` property as the `description` value to treat
     the description as HTML
 - Fix undefined index during result processing
 - Use .text and .html as functions when relevant
 - Fix flash of "No results found" message
 - Move all callbacks to settings object
