module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // ERRORS: Real syntax/type issues that should block development
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-unreachable': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'valid-typeof': 'error',
    'no-constant-condition': 'error',
    
    // WARNINGS: Style/formatting issues that are helpful but not critical
    'prettier/prettier': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    'no-console': 'warn',
    
    // OFF: Rules that are too strict or not needed
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-var': 'off',
  },
};