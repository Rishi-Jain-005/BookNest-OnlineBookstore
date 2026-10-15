module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageReporters: ['text', 'text-summary', 'json-summary', 'lcov'],
  // Raise these as the suite grows. Branch coverage is reported separately
  // because the course asks for line AND branch coverage.
  coverageThreshold: {
    global: { lines: 20, branches: 10, functions: 20, statements: 20 }
  }
};
