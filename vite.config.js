import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
    build: {
        lib: {
            entry: fileURLToPath(new URL('src/index.js', import.meta.url)),
            name: 'lstrQuickSwitcher',
            formats: ['es', 'umd'],
            fileName: (format) => {
                // The UMD build keeps the historical filename and global so
                // existing <script> tags keep working across the 4.0 upgrade.
                return format === 'es'
                    ? 'quick-switcher.esm.js'
                    : 'quick-switcher.min.js';
            },
        },
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: true,
        // The stylesheet is compiled into dist/ by a separate sass step, so
        // the JS build must not wipe the directory out from under it.
        emptyOutDir: false,
    },
});
