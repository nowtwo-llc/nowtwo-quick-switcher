import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        // The library is DOM manipulation with no layout dependency beyond
        // scrollToSelectedItem(), whose test stubs geometry -- jsdom reports 0
        // for every layout property, so assertions written against unstubbed
        // values pass vacuously.
        environment: 'jsdom',
        include: ['test/**/*.test.js'],
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.js'],
            reporter: ['text', 'lcov'],
            // Floors set just under the current numbers, so an accidental drop
            // fails CI but ordinary refactoring does not. Raise them when
            // coverage climbs; never lower them to make a build pass.
            //
            // Recalibrated for Vitest 4, which replaced v8-to-istanbul with
            // AST-based remapping: "It is expected for users to see changes in
            // their coverage reports when updating from Vitest v3." The same
            // 124 tests over the same source now measure 94.43/86.92/94.44/94.35
            // rather than clearing the old 96/90/93/96. Nothing stopped being
            // tested — the previous figures were simply overstated.
            thresholds: {
                statements: 94,
                branches: 86,
                functions: 94,
                lines: 94,
            },
        },
    },
});
