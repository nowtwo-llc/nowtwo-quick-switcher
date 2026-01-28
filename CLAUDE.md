# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick-switcher is a front-end web component for keyboard-driven search and navigation (similar to Slack's Cmd+K switcher). It supports nested/drill-down searches, breadcrumb navigation, and intelligent result ranking based on user selection history persisted in localStorage.

Published as `@nowtwo-llc/quick-switcher` to GitHub Packages. Current version: 2.0.1.

## Commands

```bash
npm run build          # Build JS and CSS to dist/
npm run build:js       # Build JS only (RequireJS + Almond + Terser → dist/quick-switcher.min.js)
npm run build:css      # Build CSS only (Sass → dist/quick-switcher.min.css)
npm run watch          # Watch both JS and CSS for changes
npm test               # Run tests (tape + faucet): faucet test/
```

There is no dedicated lint script. ESLint is configured (`.eslintrc.json`, Google style guide) but runs through CodeClimate CI.

## Architecture

**Module system:** AMD (RequireJS) with Almond as the lightweight loader for production bundling. The build script (`build.js`) uses RequireJS optimizer with `.almond/start.frag` and `end.frag` wrappers, then minifies with Terser.

**Core modules in `src/`:**

- **quick-switcher.js** — Main module. Manages the full UI lifecycle: hotkey binding (Ctrl/Cmd+K), DOM rendering from `quick-switcher.html` template, keyboard navigation, debounced search (1000ms), nested search callback stacks, and breadcrumb state.
- **tracker.js** — Tracks user selections in localStorage (`qswitcher-tracker-{name}`). Implements a Slack-inspired time-weighted scoring algorithm that sorts results based on recency and frequency of selection.
- **tracker/statistic.js** — Time-window scoring: assigns points based on recency (100 pts for last 4h down to 10 pts for last 3 months). Maintains last 10 timestamps per item.
- **tracker/selection.js** — Per-item selection tracking with search-term-specific counts.
- **filters.js** — Search matching logic (`isMatch`, `areWordsFound`) for substring and multi-word filtering.
- **factories.js** — Singleton factory for tracker instances (one per tracker name).
- **selected-result.js** — Wraps selected items with metadata and control methods (`preventTracking()`, `preventSearchTextClearing()`).

**Key data flow:**
1. User opens switcher via hotkey → `searchCallback(searchText, resultHandler)` is called
2. Consumer calls `resultHandler.setResults(items)` to populate results
3. Items with a `searchCallback` property create nested drill-down searches (breadcrumb navigation)
4. Items with a `trackerId` are tracked for intelligent sorting

**Tests** use the `tape` framework, located in `test/`. Run individual test files with `node test/filters.js`.
