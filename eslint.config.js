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
        // Node-side files. The extension classes matter: build scripts are
        // written as ESM with .mjs, and a bare '*.js' pattern silently leaves
        // them without Node globals.
        files: [
            'test/**/*.{js,mjs}',
            'scripts/**/*.{js,mjs}',
            '*.config.{js,mjs}',
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
