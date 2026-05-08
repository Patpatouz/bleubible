import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['firestore.rules', 'DRAFT_firestore.rules'],
    languageOptions: {
      parser: firebaseRulesPlugin.parser,
    },
    plugins: {
      '@firebase/security-rules': firebaseRulesPlugin,
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules,
    },
  },
];
