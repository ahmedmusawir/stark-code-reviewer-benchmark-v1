// jest.config.js
module.exports = {
  // Use ts-jest to process TypeScript files
  preset: 'ts-jest',

  // The environment in which the tests are run
  testEnvironment: 'node',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],

  // The testMatch patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],

  // A map from regular expressions to paths to transformers.
  // Includes JS/MJS so ESM-only deps (react-markdown v10+ chain) can be transformed.
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': 'ts-jest',
  },

  // Don't transform node_modules EXCEPT the ESM-only deps that react-markdown
  // pulls in (it's ESM-only as of v10). The allowlist below covers its
  // transitive chain. Update when adding more ESM-only deps.
  transformIgnorePatterns: [
    '/node_modules/(?!(react-markdown|remark-.*|micromark.*|decode-named-character-reference|character-entities.*|character-reference-invalid|property-information|hast-util-.*|space-separated-tokens|comma-separated-tokens|unist-util-.*|mdast-util-.*|trim-lines|unified|bail|is-plain-obj|trough|vfile.*|html-void-elements|zwitch|longest-streak|markdown-table|ccount|escape-string-regexp|hastscript|html-url-attributes|estree-util-is-identifier-name|devlop|fault|web-namespaces|stringify-entities|refractor|parse-entities|is-alphabetical|is-alphanumerical|is-decimal|is-hexadecimal|is-plain-obj)/)',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '<rootDir>/src/__tests__/jest.setup.ts',
    // Fixture modules (data only, no tests) — BIM-002
    '<rootDir>/src/__tests__/api/fixtures/',
  ],
};
