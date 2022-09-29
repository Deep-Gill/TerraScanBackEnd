module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'never'],
        'no-var': ['error'],
        'no-unused-vars': ['error', { args: 'none' }],
        'prefer-const': ['warn'],
        'prefer-arrow-callback': ['warn'],
    },
}

