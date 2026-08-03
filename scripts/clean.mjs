/**
 * Remove build output. Written in Node rather than `rm -rf` so the build
 * works the same on Windows.
 *
 * `types/` is generated from the source JSDoc by `npm run build:types`, so it
 * is build output too — it used to be a hand-maintained `.d.ts` that had to
 * survive a clean.
 */

import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

for (const dir of ['../dist', '../types']) {
    rmSync(fileURLToPath(new URL(dir, import.meta.url)), { recursive: true, force: true });
}
