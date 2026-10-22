import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true }, // Permite entender JSX
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // --- LA SOLUCIÓN A TUS IMPORTACIONES ---
      // Estas dos reglas le dicen a ESLint que las variables usadas en JSX SÍ están en uso
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      
      // Si usas React 17+, esta regla evita que te pida "import React" en cada archivo
      'react/react-in-jsx-scope': 'off',

      // --- TUS REGLAS DE ESTILO ---
      'max-len': ['warn', { 'code': 100 }], // Margen de 100
      'object-curly-newline': ['error', { 
        'ObjectExpression': { 'multiline': true, 'minProperties': 8 }, 
        'ObjectPattern': { 'multiline': true, 'minProperties': 8 },
        'ImportDeclaration': 'never' 
      }],
      'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      "react/jsx-key": "error",
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^(React|_)',
        argsIgnorePattern: '^_',
      }],
      'react/prop-types': 'off',
      'no-unreachable': 'error',
    },
    settings: {
      react: { version: '19.2.0' }, // Detecta automáticamente tu versión de React
    },
  },
  {
    files: ['src/components/Shared/Icons.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettierConfig, // Siempre al final para evitar conflictos
];