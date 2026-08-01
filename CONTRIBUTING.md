# Contributing

Thanks for your interest in Quick Switcher.

## Getting set up

You need Node 20 or newer.

```bash
git clone https://github.com/nowtwo-llc/nowtwo-quick-switcher.git
cd nowtwo-quick-switcher
npm install
npm test
```

`npm run demo` starts a dev server for the demo page, which builds against
`src/` — the fastest way to see a change in a real browser.

## Before opening a pull request

```bash
npm run lint
npm test
npm run build
```

CI runs all three on Node 20, 22, and 24.

## Conventions

- 4-space indentation, single quotes, trailing commas.
- JSDoc on anything exported.
- Comments should explain *why* something is the way it is. A few non-obvious
  invariants are documented inline; please keep them.
- New behavior needs a test. Bug fixes need a test that fails without the fix.

## Things that are load-bearing

A few pieces look like they could be simplified but cannot:

- **`text` renders via `textContent`, `html` via `innerHTML`.** That split is a
  security boundary — `text` is documented as safe for untrusted data.
- **`src/index.js` declares only a default export.** Adding a named export
  turns the UMD global into an object and breaks every `<script>` consumer.
- **`tracker.sort()` is non-mutating**, by contract.
- **Element IDs are namespaced per instance**, so more than one switcher can
  live on a page.

## Reporting bugs

Open an issue with what you expected, what happened, and the smallest
`searchCallback` that reproduces it. Browser and version help.

## Security

Please don't open a public issue for a security problem — see
[SECURITY.md](SECURITY.md).

## License

Contributions are accepted under the [MIT License](LICENSE).
