/**
 * Two projects:
 *   unit        — pure logic and HTTP-shape tests, no database, runs anywhere
 *   integration — hits a real MongoDB (CI service container, or docker compose)
 *
 * `npm test` runs both. `npm run test:unit` runs only the database-free ones.
 */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js']
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 30000
    }
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/seed/**'],
  coverageReporters: ['text', 'text-summary', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: { lines: 20, branches: 10, functions: 20, statements: 20 }
  }
};
