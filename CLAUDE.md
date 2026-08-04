# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

Quick Switcher is a dependency-free, front-end command palette for the web
(the Slack / VS Code <kbd>Cmd</kbd>+<kbd>K</kbd> pattern). It supports nested
drill-down searches with breadcrumbs and ranks results by the user's own
selection history, persisted in `localStorage`.

Published as `@nowtwo-llc/quick-switcher` to **npmjs.com** only. A GitHub Packages
mirror was published previously and has been removed; do not reintroduce it.
Maintained by NowTwo LLC; originally created by Matt Light
([lightster](https://github.com/lightster)).

The scope must stay `@nowtwo-llc`: it matches the repository owner and is the
name already published. The npm org
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
npm run lint           # oxlint + Prettier + Stylelint, with fixes
npm run lint:check     # same, no fixes — what CI runs
npm run build          # clean + JS + CSS + type declarations into dist/
npm run build:js       # Vite library build (ESM + UMD)
npm run build:css      # Sass -> dist/quick-switcher.min.css
npm run build:types    # tsc --emitDeclarationOnly from JSDoc
npm run demo           # Vite dev server for the demo page
npm run build:demo     # Build the demo into demo/dist (deployed to Pages)
```

Run a single test file with `npx vitest run test/tracker.test.js`.

## Types

The source is JavaScript; the published declarations in `types/` are **generated** from
JSDoc by `npm run build:types`, and `types/` is gitignored build output.

The whole public type surface lives in **`src/types.js`** as `@typedef` / `@callback`
blocks — a module with no runtime content. Other files reference it as
`import('./types.js').TypeName`.

This is load-bearing and easy to undo by accident. These declarations used to be
hand-maintained precisely because generation emitted `Function` for every callback:
the JSDoc said `@param {Function} [options.searchCallback]`, and `tsc` faithfully
emitted that. **Do not write bare `{Object}` or `{Function}` in JSDoc on the public
API** — name a typedef instead, or the published types silently degrade to something
that tells consumers nothing.

`test/types.test-d.ts` is the guard: it exercises the declarations against real usage
and `npm run typecheck` fails if they stop describing it. It is never run and never
published.

`src/index.js` re-exports every public type as a `@typedef` alias so consumers can
`import type { SearchCallback } from '@nowtwo-llc/quick-switcher'`, and casts the
default export to `QuickSwitcherFactory` — inference alone reports a plain function,
losing the `filters`/`sorters` helpers assigned onto it at runtime.

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

Pushing a `v*` tag runs `.github/workflows/publish.yml`. It asserts the tag
matches `package.json`'s version, and `prepublishOnly` runs the build — `dist/`
is not committed.

Two jobs: `npm` publishes to npmjs.com, then `github-packages` mirrors it via
`needs: npm`, so the internal copy is never ahead of the public one.

Authentication for npm is **trusted publishing** (OIDC), so there is no
`NPM_TOKEN` secret. That requires `id-token: write` and npm >= 11.5.1, which is
why the job upgrades npm first. Provenance is attached automatically; do not add
a `--provenance` flag.

Two things that will break the publish if changed carelessly:

- `publishConfig` must contain only `access`. Adding a `registry` there
  out-ranks `setup-node`'s `registry-url` *and* a `--registry` flag.
- The `environment: npm-publish` name must match the Environment field on the
  trusted publisher at npmjs.com. GitHub puts it in the OIDC claim and npm
  rejects the publish if they disagree.

Actions are pinned to commit SHAs with the tag in a trailing comment. Keep it
that way — a mutable `@v7` tag can be repointed by anyone who compromises the
action's repository.
