# Contributing

Thanks for your interest in Quick Switcher.

## Getting set up

**Use Node 22** — there is an `.nvmrc`, so `nvm use` picks it up.

The `engines` field says `>=20` because that describes *consumers*: the
package ships browser code with no runtime dependencies, so nothing in it ever
executes in Node and it imposes almost nothing on the projects that install it.

Developing it is stricter. The dev toolchain floor is **Node 22.22.2**, set by
jsdom 30 (`^22.22.2 || ^24.15.0 || >=26.0.0`). On an older Node the test run
fails with `webidl.util.markAsUncloneable is not a function` before a single
test executes. That constraint deliberately lives here and in `.nvmrc` rather
than in `engines`, which would push it onto consumers who are unaffected by it.

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
