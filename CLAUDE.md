# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

Quick Switcher is a dependency-free, front-end command palette for the web
(the Slack / VS Code <kbd>Cmd</kbd>+<kbd>K</kbd> pattern). It supports nested
drill-down searches with breadcrumbs and ranks results by the user's own
selection history, persisted in `localStorage`.

Published as `@nowtwo-llc/quick-switcher` to **npmjs.com** (canonical, what the
README points at) and mirrored to **GitHub Packages** for internal use.
Maintained by NowTwo LLC; originally created by Matt Light
([lightster](https://github.com/lightster)).

The scope must stay `@nowtwo-llc`: GitHub Packages requires the npm scope to
match the repository owner, and the owner is `nowtwo-llc`. The npm org
`nowtwollc` also exists but is unused — publishing under it would force two
different package names for the same library, since `package.json` has only one
`name` field.

Scoped packages default to restricted on npm, so `publishConfig.access` must
stay `"public"` or publishing fails.

## Commands

```bash
npm test               # Vitest (jsdom)
npm run test:watch     # Vitest in watch mode
npm run test:coverage  # Coverage report
npm run lint           # ESLint 9 flat config
npm run build          # clean + JS + CSS + type declarations into dist/
npm run build:js       # Vite library build (ESM + UMD)
npm run build:css      # Sass -> dist/quick-switcher.min.css
npm run build:types    # tsc --emitDeclarationOnly from JSDoc
npm run demo           # Vite dev server for the demo page
npm run build:demo     # Build the demo into demo/dist (deployed to Pages)
```

Run a single test file with `npx vitest run test/tracker.test.js`.

## Architecture

**Modules:** ES modules throughout. `vite.config.js` builds the library;
`demo/vite.config.js` builds the demo page against `src/` (not `dist/`), so the
demo always reflects the working tree.

**Two build outputs, deliberately:**
- `dist/quick-switcher.esm.js` — ESM entry.
- `dist/quick-switcher.min.js` — UMD, exposing the `lstrQuickSwitcher` global.
  The filename and global name are held fixed for backward compatibility with
  existing `<script>` consumers. `src/index.js` therefore declares **only** a
  default export — adding a named export would turn the UMD global into an
  object and break those consumers.

**Core modules in `src/`:**

- **index.js** — Package entry. Default export only (see above); attaches
  `filters` and `sorters` as properties of the exported function.
- **quick-switcher.js** — The UI. Hotkey binding, DOM lifecycle, keyboard
  navigation, debounced search, the nested-search stack, and breadcrumbs.
- **template.js** — The markup, inlined as a template literal. Takes an
  `idPrefix` so multiple instances don't produce duplicate element IDs.
- **tracker.js** — Selection history per tracker name, and result ranking.
- **tracker/statistic.js** — Time-window scoring (100 points for the last 4
  hours down to 10 for the last 3 months); keeps the 10 most recent timestamps.
- **tracker/selection.js** — Per-item statistics, overall and per search term.
- **storage.js** — Guarded `localStorage` wrapper. Every access is wrapped;
  failures degrade to a no-op rather than breaking the switcher.
- **filters.js** — `isMatch` / `areWordsFound`, case-insensitive.
- **factories.js** — One shared tracker instance per tracker name.
- **selected-result.js** — Wraps a selection with `preventTracking()` and
  `preventSearchTextClearing()`.

**Data flow:**
1. Hotkey or `open()` → `searchCallback(searchText, resultHandler)`.
2. Consumer calls `resultHandler.setResults(items)` or `setError()`.
3. Items carrying a `searchCallback` become nested searches with breadcrumbs.
4. Items carrying a `trackerId` are ranked when `trackChildrenAs` is set.

## Conventions

- 4-space indent, single quotes, trailing commas, JSDoc on exported members.
- Comments explain *why*, not *what*. Several non-obvious invariants are
  documented inline — don't strip them.
- `text` renders through `textContent`; only `html` uses `innerHTML`. This is a
  security boundary, not a style choice. Do not "simplify" it.
- Listeners are registered with an `AbortSignal` so `destroy()` can detach them
  all at once, including the `document`-level ones.
- `tracker.sort()` must stay non-mutating — it neither reorders the caller's
  array nor writes properties onto result objects.

## Testing notes

Vitest with the jsdom environment. Two things to watch for:

- **jsdom reports 0 for all layout properties.** `scrollToSelectedItem()`
  depends on `offsetTop` / `offsetHeight`, so its test stubs geometry via
  `Object.defineProperty`. Assertions written against unstubbed zeros pass
  vacuously.
- Use fake timers (`vi.useFakeTimers()`) for the search debounce and for
  time-window scoring; call `factories.clear()` and `localStorage.clear()`
  between tests, since trackers are cached per name.

## Release

Releases publish from `.github/workflows/publish.yml` when a GitHub Release is
published. The workflow asserts the tag matches `package.json`'s version, and
`prepublishOnly` runs the build — `dist/` is not committed.

Authentication is npm **trusted publishing** (OIDC), so there is no `NPM_TOKEN`
secret. That requires `id-token: write` and npm >= 11.5.1, which is why the
workflow upgrades npm before publishing. Provenance attestations are generated
automatically; do not add a `--provenance` flag.
