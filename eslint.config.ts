import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import lint from 'typescript-eslint';

export default defineConfig(
  // 1. Ignore files configuration
  {
    ignores: ['dist', 'node_modules', '*.config.js'],
  },

  // 2. Base JavaScript rules (equivalent to eslint:recommended)
  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    ...js.configs.recommended,
  },

  // 3. TypeScript rules configuration
  {
    // Match TypeScript files
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        // Must specify tsconfig file path
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    extends: [
      ...lint.configs.strictTypeChecked,
      ...lint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.recommended,
    ],
    // Plugins and rules configuration
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // ------------------------------------------------------------------
      // A. Customize import sorting rules (core)
      // ------------------------------------------------------------------
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // only import
            ['^'],
            // type import
            ['^.*\\u0000$'],
            // external
            ['^@?\\w'],
            // internal
            ['^(~|@)(/.*|$)', '^#?\\w'],
            // parents
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // brother
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // style
            ['^.+\\.css$', '^.+\\.less$', '^.+\\.scss$', '^.+\\.postcss$', '^.+\\.sass$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
      'import/export': 'off',
      'import/default': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-duplicates': 'off',

      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',

      // ------------------------------------------------------------------
      // B. Common TS rule adjustments
      // ------------------------------------------------------------------
      // Disable native no-unused-vars, use TS version instead
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 4. Prettier integration (must be at the end of the array to override all conflicting rules)
  prettierConfig,
  // Enable eslint-plugin-prettier plugin
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      // Execute Prettier rules as ESLint rules
      'prettier/prettier': 'error',
    },
  },
);
