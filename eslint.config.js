import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.vercel', 'android', 'node_modules']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        TextEncoder: 'readonly',
        Uint8Array: 'readonly',
        crypto: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        Image: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        FileReader: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        HTMLCanvasElement: 'readonly',
        ImageBitmap: 'readonly',
        MessagePort: 'readonly',
        TextDecoder: 'readonly',
        navigator: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-assignment': 'off',
      'no-useless-escape': 'off',
      'no-empty': 'warn',
      'no-cond-assign': 'warn',
    },
  },
])
