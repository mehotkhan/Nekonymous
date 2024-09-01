import globals from "globals";

// // ESLint Configuration
// export default [
//   {
//     files: ["**/*.{js,mjs,cjs,ts}"],
//     languageOptions: {
//       parser: tsParser,
//       globals: globals.browser,
//     },
//     plugins: {
//       "@typescript-eslint": tsPlugin,
//     },
//     // Including the recommended configurations directly
//     rules: {
//       ...pluginJs.configs.recommended.rules,  // JavaScript recommended rules
//       ...tsPlugin.configs.recommended.rules,  // TypeScript recommended rules
//       "@typescript-eslint/no-unused-vars": "warn",
//       "@typescript-eslint/explicit-function-return-type": "off",
//       "no-console": "warn",
//       "semi": ["error", "always"],
//       "quotes": ["error", "double"],
//       "indent": ["error", 2],
//     },
//     ignores: ["node_modules/"],  
//   }
// ];


import ESLint from '@eslint/js';
import ESLintConfigPrettier from 'eslint-config-prettier';
import Oxlint from 'eslint-plugin-oxlint';
import TSESLint from 'typescript-eslint';

export default TSESLint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: ["node_modules/"],
  },
  ESLint.configs.recommended,
  ...TSESLint.configs.recommended,
  Oxlint.configs['flat/recommended'],
  ESLintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {},
    rules: {},
  },
)