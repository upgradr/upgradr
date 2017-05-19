module.exports = {
  cacheDirectory: '.cache/jest',
  clearMocks: true,
  projects: ['<rootDir>'],
  collectCoverage: false,
  collectCoverageFrom: ['/src/**/*.{js,jsx}'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};
