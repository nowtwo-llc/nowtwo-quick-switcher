import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        // Build output. These need to be anchored per directory -- a bare
        // 'dist/**' only matches the one at the project root.
        ignores: [
            'dist/**',
            'demo/dist/**',
            'coverage/**',
        ],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-var': 'error',
            'prefer-const': 'error',
            'eqeqeq': ['error', 'always'],
            'no-console': ['warn', {allow: ['warn', 'error']}],
        },
    },
    {
        files: [
            'test/**/*.js',
            'scripts/**/*.js',
            '*.config.js',
        ],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },
];
