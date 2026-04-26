import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow `any` — API responses are dynamic and typing everything is impractical
      '@typescript-eslint/no-explicit-any': 'off',

      // Downgrade unused vars to warning, and allow underscore-prefixed vars
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Context files export hooks alongside components — this is intentional
      'react-refresh/only-export-components': 'off',

      // Allow setState in effects — we use it intentionally in some cases
      'react-hooks/set-state-in-effect': 'off',

      // Missing deps warnings are useful but not errors
      'react-hooks/exhaustive-deps': 'warn',

      // Allow function hoisting (useEffect calling function declared below)
      'react-hooks/immutability': 'off',
    },
  },
])
