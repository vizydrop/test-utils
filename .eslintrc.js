module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true,
    },
    extends: ["eslint:recommended", "plugin:node/recommended", "prettier"],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    parserOptions: {
        ecmaVersion: 2020,
    },
    rules: {
        "linebreak-style": ["error", "unix"],
        quotes: ["error", "backtick"],
        semi: ["error", "always"],
    },
};
