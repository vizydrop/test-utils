module.exports = {
    trailingComma: `all`,
    bracketSpacing: false,
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    arrowParens: `always`,
    overrides: [
        {
            files: [`*.json`, `*.yml`],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
