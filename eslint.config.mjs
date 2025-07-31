import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/build/",
    "**/*.min.js",
    "**/processed_jobs.json"
  ]),
  {
    extends: compat.extends("eslint:recommended"),

    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: "latest",
      sourceType: "module"
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      "no-undef": "error",
      "no-unreachable": "error",
      "no-duplicate-imports": "error",
      "no-console": "off",
      indent: ["warn", 4],
      quotes: ["warn", "double"],
      semi: ["warn", "always"],
      "comma-dangle": ["warn", "never"],
      "no-trailing-spaces": "warn",
      "eol-last": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "require-await": "warn",
      "no-async-promise-executor": "error"
    }
  }
]);
