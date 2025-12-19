import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import lint from 'typescript-eslint';

export default defineConfig(
  // 1. 忽略文件配置
  {
    ignores: ['dist', 'node_modules', '*.config.js'],
  },

  // 2. 基础 JavaScript 规则 (相当于 eslint:recommended)
  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    ...js.configs.recommended,
  },

  // 3. TypeScript 规则配置
  {
    // 匹配 TypeScript 文件
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        // 必须指定 tsconfig 文件路径
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    extends: [
      ...lint.configs.strictTypeChecked,
      ...lint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.recommended,
    ],
    // 插件和规则配置
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // ------------------------------------------------------------------
      // A. 定制 import 排序规则 (核心)
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
      // B. 常见的 TS 规则调整
      // ------------------------------------------------------------------
      // 禁用原生 no-unused-vars，使用 TS 版本的规则
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

  // 4. Prettier 集成 (必须放在数组末尾以覆盖所有冲突规则)
  prettierConfig,
  // 启用 eslint-plugin-prettier 插件
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      // 将 Prettier 规则作为 ESLint 规则执行
      'prettier/prettier': 'error',
    },
  },
);
