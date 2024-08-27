import globals from "globals";
import pluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

// ESLint Configuration
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    // Including the recommended configurations directly
    rules: {
      ...pluginJs.configs.recommended.rules,  // JavaScript recommended rules
      ...tsPlugin.configs.recommended.rules,  // TypeScript recommended rules
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-console": "warn",
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "indent": ["error", 2],
    },
    ignores: ["node_modules/"],  
  }
];
