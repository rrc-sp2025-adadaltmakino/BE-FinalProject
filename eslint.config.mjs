import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['node_modules/', 'dist/', 'build/', 'tests/'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "warn",
        },
    },
];