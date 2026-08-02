/**
 * Verify the built artifacts, not the source.
 *
 * The test suite imports from src/, so it cannot catch a build or packaging
 * change that breaks what consumers actually receive: the UMD global, the ESM
 * entry, the exports map, or the stylesheet. Run after `npm run build`.
 */

import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

import {JSDOM} from 'jsdom';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = require('../package.json');

const checks = [];

/**
 * Register a named check.
 *
 * @param {string} name - What is being verified.
 * @param {Function} fn - Throws on failure.
 */
const check = (name, fn) => checks.push({name, fn});

/**
 * Resolve a package-relative path.
 *
 * @param {string} relative - Path relative to the package root.
 * @returns {string} Absolute path.
 */
const at = (relative) => root + relative.replace(/^\.\//, '');

// ---------------------------------------------------------------------------

check('dist/ exists (did you run `npm run build`?)', () => {
    assert.ok(existsSync(at('./dist')), 'dist/ is missing');
});

check('every path in package.json resolves on disk', () => {
    const targets = new Set([pkg.main, pkg.module, pkg.types]);

    const walk = (value) => {
        if (typeof value === 'string') {
            if (value.startsWith('./')) {
                targets.add(value);
            }
            return;
        }
        if (value && typeof value === 'object') {
            Object.values(value).forEach(walk);
        }
    };
    walk(pkg.exports);

    for (const target of targets) {
        assert.ok(target, 'a manifest entry is empty');
        assert.ok(
            existsSync(at(target)),
            `${target} is referenced by package.json but does not exist`
        );
    }
});

check('files[] covers everything the exports map points at', () => {
    const roots = pkg.files.map((entry) => entry.replace(/\/$/, ''));

    const walk = (value, found = []) => {
        if (typeof value === 'string' && value.startsWith('./')) {
            found.push(value.slice(2));
        } else if (value && typeof value === 'object') {
            Object.values(value).forEach((v) => walk(v, found));
        }
        return found;
    };

    for (const target of walk(pkg.exports)) {
        if (target === 'package.json') {
            continue;
        }
        assert.ok(
            roots.some((r) => target === r || target.startsWith(`${r}/`)),
            `${target} is exported but not included by files[]`
        );
    }
});

check('UMD build exposes a callable global and renders', () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        runScripts: 'outside-only',
    });

    dom.window.eval(readFileSync(at('./dist/quick-switcher.min.js'), 'utf8'));

    const factory = dom.window.lstrQuickSwitcher;
    assert.equal(
        typeof factory,
        'function',
        'window.lstrQuickSwitcher must be the factory itself, not a module object'
    );

    const switcher = factory({
        searchDelay: 0,
        searchCallback: (searchText, resultHandler) => {
            resultHandler.setResults([
                {text: 'Alpha'},
                {text: '<img src=x onerror="window.__xss=1">'},
            ]);
        },
        selectCallback: () => {},
    });

    switcher.open();
    assert.equal(switcher.isOpen(), true, 'UMD switcher did not open');

    const doc = dom.window.document;
    assert.equal(
        doc.querySelectorAll('.lstr-qswitcher-results li').length,
        2,
        'UMD switcher rendered the wrong number of results'
    );
    assert.equal(
        doc.querySelector('.lstr-qswitcher-results img'),
        null,
        'UMD build rendered `text` as markup -- the XSS fix is not in dist'
    );
    assert.equal(dom.window.__xss, undefined, 'injected script executed');

    switcher.destroy();
    assert.equal(
        doc.querySelector('.lstr-qswitcher'),
        null,
        'destroy() did not remove the element'
    );
});

check('UMD build keeps the documented public API', async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        runScripts: 'outside-only',
    });
    dom.window.eval(readFileSync(at('./dist/quick-switcher.min.js'), 'utf8'));

    const switcher = dom.window.lstrQuickSwitcher({searchDelay: 0});

    assert.deepEqual(
        Object.keys(switcher).sort(),
        ['close', 'destroy', 'isOpen', 'open', 'toggle'],
        'the instance API changed'
    );

    switcher.destroy();
});

check('ESM build default-exports the factory with helpers attached', async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');

    global.window = dom.window;
    global.document = dom.window.document;
    global.AbortController = dom.window.AbortController;
    Object.defineProperty(global, 'navigator', {
        value: dom.window.navigator,
        configurable: true,
    });

    const module = await import(at('./dist/quick-switcher.esm.js'));
    const factory = module.default;

    assert.equal(typeof factory, 'function', 'ESM default export is not a function');
    assert.equal(typeof factory.filters.isMatch, 'function', 'filters missing');
    assert.equal(typeof factory.sorters.tracker, 'function', 'sorters missing');
    assert.equal(
        factory.filters.isMatch('WORLD', 'hello world'),
        true,
        'ESM filters are not case-insensitive'
    );

    const switcher = factory({
        searchDelay: 0,
        searchCallback: (searchText, resultHandler) => {
            resultHandler.setResults(['One', 'Two']);
        },
    });
    switcher.open();

    assert.equal(
        dom.window.document.querySelectorAll('.lstr-qswitcher-results li').length,
        2,
        'ESM switcher rendered the wrong number of results'
    );

    switcher.destroy();
});

check('stylesheet ships the theming variables and no bare colors', () => {
    const css = readFileSync(at('./dist/quick-switcher.min.css'), 'utf8');

    assert.match(css, /\.lstr-qswitcher-container\{[^}]*color:/, 'container has no text color');
    assert.doesNotMatch(css, /color:\s*#999\b/i, 'low-contrast #999 is back');

    for (const variable of [
        '--lstr-qswitcher-bg',
        '--lstr-qswitcher-fg',
        '--lstr-qswitcher-muted',
        '--lstr-qswitcher-accent',
        '--lstr-qswitcher-selected-bg',
    ]) {
        assert.ok(css.includes(variable), `${variable} is missing from the build`);
    }
});

check('type declarations describe the shipped entry point', () => {
    const dts = readFileSync(at(pkg.types), 'utf8');

    assert.match(dts, /export default lstrQuickSwitcher/, 'no default export');
    assert.match(dts, /QuickSwitcherOptions/, 'options type missing');
    assert.match(dts, /destroy\(\)/, 'destroy() missing from the instance type');
});

// ---------------------------------------------------------------------------

let failed = 0;

for (const {name, fn} of checks) {
    try {
        await fn();
        console.log(`  ok  ${name}`);
    } catch (error) {
        failed++;
        console.error(`FAIL  ${name}`);
        console.error(`      ${error.message}`);
    }
}

console.log(`\n${checks.length - failed}/${checks.length} dist checks passed`);

if (failed) {
    process.exitCode = 1;
}
