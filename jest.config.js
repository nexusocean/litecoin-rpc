/* global console */
import { existsSync } from 'node:fs';

// Every spec talks to a live node configured in .env.test. Without it, skip
// the suite instead of failing on missing credentials.
const hasNode = existsSync('.env.test');
if (!hasNode) {
  console.warn('No .env.test found: skipping live-node tests.');
}

/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript' },
          target: 'es2022',
        },
      },
    ],
  },
  testTimeout: 30_000,
  // The specs share one node, and wallet lock state is global to it: a spec
  // locking the wallet would break another one mid-signing. Run files serially.
  maxWorkers: 1,
  testMatch: hasNode ? ['**/tests/**/*.spec.ts'] : [],
  passWithNoTests: !hasNode,
  transformIgnorePatterns: [],
};
