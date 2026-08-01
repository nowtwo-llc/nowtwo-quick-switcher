import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['test/**/*.test.js'],
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.js'],
            reporter: ['text', 'lcov'],
        },
    },
});
