# Quick Switcher

A keyboard-driven command palette for the web — the <kbd>Cmd</kbd>+<kbd>K</kbd>
pattern from Slack, VS Code, and Spotlight, as a small library you can point at
your own data.

- **No runtime dependencies.** Ships as ESM, UMD, and a plain `<script>` global.
- **Nested searches.** Any result can open a search of its own, with breadcrumbs.
- **Learns from use.** Results are ranked by how often and how recently you have
  picked them, per search term.
- **Bring your own data.** One callback in, results out — sync or async.

[**Live demo**](https://nowtwo-llc.github.io/nowtwo-quick-switcher/)

## Install

This package is published to GitHub Packages, so npm needs to know where to
find the `@nowtwo-llc` scope. Add this to your project's `.npmrc`:

```
@nowtwo-llc:registry=https://npm.pkg.github.com
```

GitHub Packages requires authentication for installs, including public
packages, so you will also need a token with `read:packages` in your
`~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

Then:

```bash
npm install @nowtwo-llc/quick-switcher
```

## Quick start

```js
import lstrQuickSwitcher from '@nowtwo-llc/quick-switcher';
import '@nowtwo-llc/quick-switcher/style.css';

const switcher = lstrQuickSwitcher({
  searchCallback(searchText, resultHandler) {
    const people = ['Zach', 'Stacy', 'Matt', 'Lightster', 'Baxter'];

    resultHandler.setResults(
      people.filter((person) => resultHandler.filters.isMatch(searchText, person))
    );
  },

  selectCallback(selected) {
    console.log('picked', selected.selectedValue);
  },
});
```

That's it — <kbd>Cmd</kbd>+<kbd>K</kbd> (macOS) or <kbd>Ctrl</kbd>+<kbd>K</kbd>
now opens the switcher. Call `switcher.open()` to open it yourself.

### Without a bundler

```html
<link rel="stylesheet" href="/path/to/quick-switcher.min.css">
<script src="/path/to/quick-switcher.min.js"></script>
<script>
  var switcher = lstrQuickSwitcher({ /* ...options... */ });
</script>
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `searchCallback` | `function` | no-op | Produces results for a query. See below. |
| `selectCallback` | `function` | no-op | Runs when a result is chosen. Return `false` to keep the switcher open. |
| `selectChildSearchCallback` | `function` | no-op | Runs when a nested search is entered. Return `false` to block it. |
| `searchDelay` | `number` | `1000` | Debounce in milliseconds before `searchCallback` runs. Lower it for local data. |
| `hotKey` | `string \| null` | `'K'` | Key used with Cmd/Ctrl to open. `null` disables the hotkey entirely. |
| `trackChildrenAs` | `string` | — | Tracker name. Set it to rank this search's results by usage. |
| `parentDom` | `HTMLElement` | `document.body` | Element to mount into. |

> The `searchDelay` default of 1000ms suits a search that hits the network. If
> you are filtering an in-memory list, set it to `0`.

## The search callback

```js
searchCallback(searchText, resultHandler) {
  // ...
}
```

Call exactly one of:

- `resultHandler.setResults(items)` — render `items`.
- `resultHandler.setError()` — show the error pane.

Both are safe to call asynchronously. Results from a superseded query are
discarded automatically, so a slow response cannot overwrite a newer one.

The handler also carries helpers:

- `resultHandler.filters.isMatch(needle, haystack)` — case-insensitive
  substring or all-words match.
- `resultHandler.filters.areWordsFound(needle, haystack)` — all-words match only.
- `resultHandler.sorters.tracker(name)` — the tracker for `name`, for manual
  ranking via `tracker.sort(items, searchText)`.

If your search is cancellable, **return an abort function**. The switcher calls
it when the query changes before your results arrive:

```js
searchCallback(searchText, resultHandler) {
  const controller = new AbortController();

  fetch(`/search?q=${encodeURIComponent(searchText)}`, {signal: controller.signal})
    .then((response) => response.json())
    .then((items) => resultHandler.setResults(items))
    .catch(() => resultHandler.setError());

  return () => controller.abort();
}
```

## Results

A result is either a string, or an object:

| Property | Type | Description |
| --- | --- | --- |
| `text` | `string \| function` | Label, rendered as **plain text**. |
| `html` | `string \| function` | Label, rendered as **markup**. Takes precedence over `text`. |
| `description` | `string \| object` | Secondary line. Same `text`/`html` rules. |
| `searchCallback` | `function` | Makes this result a nested search. |
| `breadcrumbText` | `string` | Breadcrumb label for the nested search. |
| `trackerId` | `string` | Identity for usage tracking. Required to be ranked. |
| `trackerStaticSort` | `number` | Hard ordering applied before usage score. Lower comes first. |
| `searchDelay` | `number` | Overrides the debounce inside a nested search. |
| `selectCallback` | `function` | Overrides the select handler inside a nested search. |
| `selectChildSearchCallback` | `function` | Overrides the child handler inside a nested search. |
| `trackChildrenAs` | `string` | Tracker name for a nested search's own results. |

> **`text` is escaped; `html` is not.** Never build an `html` value out of
> untrusted input.

Nested searches inherit any callback they don't declare from the search they
were reached from, and <kbd>Backspace</kbd> on an empty box steps back out.

## The selected result

`selectCallback` and `selectChildSearchCallback` receive:

| Member | Description |
| --- | --- |
| `selectedValue` | The result that was chosen. |
| `searchText` | The query active at selection time. |
| `parent` | The options object (or parent item) the result came from. |
| `domEvent` | The originating DOM event. |
| `preventTracking()` | Do not record this selection. |
| `preventSearchTextClearing()` | Keep the query when entering a nested search. |

## Usage-based ranking

Set `trackChildrenAs` and give results a `trackerId`:

```js
lstrQuickSwitcher({
  trackChildrenAs: 'main',
  searchCallback(searchText, resultHandler) {
    resultHandler.setResults([
      {text: 'Dashboard', trackerId: 'dashboard'},
      {text: 'Settings', trackerId: 'settings'},
    ]);
  },
});
```

Selections are stored in `localStorage` under `qswitcher-tracker-<name>` and
scored on the time-weighted model described in
[Slack's quick switcher write-up](https://slack.engineering/a-faster-smarter-quick-switcher-77cbc193cb60):
recent picks are worth far more than old ones, and a pick for *this* search
term outweighs general popularity. Storage failures degrade silently — a
blocked or full `localStorage` disables ranking rather than breaking the
switcher.

## Instance API

| Method | Description |
| --- | --- |
| `open()` | Open, resetting to the root search. |
| `close()` | Close. |
| `toggle()` | Open if closed, close if open. |
| `isOpen()` | Whether the switcher is currently open. |
| `destroy()` | Detach all listeners and remove the element. Safe to call twice. |

Call `destroy()` when tearing down a view — the hotkey and navigation
listeners live on `document` and are only removed here.

## Styling

Import the compiled stylesheet, or the Sass source to theme it:

```js
import '@nowtwo-llc/quick-switcher/style.css';
```

```scss
@use '@nowtwo-llc/quick-switcher/scss';
```

Every class is prefixed `lstr-qswitcher-`. The main hooks are
`-overlay`, `-container`, `-popup`, `-search`, `-results`,
`-result-container`, `-result-description`, `-result-selected`,
`-result-category`, `-breadcrumb`, and `-footer`.

### Theming

Every color reads through a CSS custom property, so you can retheme the
switcher without overriding a single selector. Set the variables anywhere up
the tree — `:root`, `body`, or a wrapper element:

```css
:root {
  --lstr-qswitcher-bg:          #f5f6f7;  /* panel background */
  --lstr-qswitcher-fg:          #16181d;  /* primary text */
  --lstr-qswitcher-muted:       #5f6673;  /* descriptions, breadcrumbs */
  --lstr-qswitcher-surface:     #ffffff;  /* search box and footer */
  --lstr-qswitcher-accent:      #5468ff;  /* search focus ring and icon */
  --lstr-qswitcher-input-fg:    #000000;  /* search text */
  --lstr-qswitcher-selected-bg: #3274ce;  /* highlighted result */
  --lstr-qswitcher-selected-fg: #ffffff;  /* highlighted result text */
  --lstr-qswitcher-key-fg:      #969faf;  /* footer key hints */
  --lstr-qswitcher-close-fg:    #666666;  /* mobile close button */
  --lstr-qswitcher-overlay-bg:  rgba(0, 0, 0, 0.5);
}
```

Those are the defaults, so you only need to declare the ones you change. A
dark theme is eleven lines:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --lstr-qswitcher-bg: #1c1f25;
    --lstr-qswitcher-fg: #e8eaed;
    --lstr-qswitcher-muted: #9aa1ac;
    --lstr-qswitcher-surface: #14161a;
    --lstr-qswitcher-accent: #6c9bff;
    --lstr-qswitcher-input-fg: #e8eaed;
    --lstr-qswitcher-selected-bg: #2f6fed;
    --lstr-qswitcher-key-fg: #8b93a1;
    --lstr-qswitcher-close-fg: #9aa1ac;
    --lstr-qswitcher-overlay-bg: rgba(0, 0, 0, 0.65);
  }
}
```

The switcher never inherits text color from the host page — it paints its own
background, so inheriting would put light text on a light panel in any
dark-themed app.

## Browser support

Modern evergreen browsers. The build targets ES2020 and relies on
`AbortController`, `Element.closest`, and `AbortSignal`-based listener removal.

## Development

```bash
npm install
npm test          # vitest
npm run demo      # dev server for the demo page
npm run build     # dist/ JS, CSS, and type declarations
npm run lint
```

## Upgrading from 3.x

See [changelog.md](changelog.md) for the full list. The changes most likely to
affect you:

- The package is now `@nowtwo-llc/quick-switcher` (was
  `@nowtwo-llc/quick-switcher`).
- **`text` is now escaped.** If you were passing markup in `text`, move it to
  `html`.
- The library is now ESM-first; the UMD build and the `lstrQuickSwitcher`
  global are unchanged.
- `filters.isMatch` is now case-insensitive.

## License

MIT — see [LICENSE](LICENSE).

Originally created by Matt Light ([lightster](https://github.com/lightster)) and
adapted with thanks. Maintained by NowTwo LLC.
