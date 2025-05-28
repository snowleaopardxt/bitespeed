/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/__tests__/**/*.ts"],
  setupFilesAfterEnv: ["./jest.setup.ts"],
  testTimeout: 30000 // Increase timeout to 30 seconds
}; 