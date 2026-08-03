import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * Config for the demo site, which is deployed to GitHub Pages. It builds the
 * demo against the library source rather than dist/, so the page always
 * reflects the current working tree.
 */
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    // Relative so the site works from a project-page subpath.
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
