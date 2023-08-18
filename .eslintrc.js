// eslint-disable-next-line @typescript-eslint/no-var-requires, unicorn/prefer-module
const path = require("node:path");

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      files: ["*.ts", "*.tsx", "*.js", "*.jsx"],
      parserOptions: {
        // eslint-disable-next-line unicorn/prefer-module
        project: path.join(__dirname, "tsconfig.json"),
      },
      env: {
        node: true,
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    // eslint-disable-next-line unicorn/prefer-module
    project: path.join(__dirname, "tsconfig.json"),
  },
  plugins: ["@typescript-eslint", "unicorn"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:unicorn/recommended",
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "unicorn/consistent-destructuring": "off",
    "unicorn/prefer-module": "off",
  },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, unicorn/prefer-module
module.exports = config;
