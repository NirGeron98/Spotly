// Load environment variables for testing
require("dotenv").config({ path: "./config.env" });

// Set test environment variables if not present
process.env.NODE_ENV = "test";
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only";
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = "1h";
}

// Global test timeout
jest.setTimeout(10000); // 10 seconds

// Add Jest extended matchers for more powerful assertions
require("jest-extended");

// Silence console logs during tests unless in debug mode
if (process.env.DEBUG !== "true") {
  global.console = {
    ...console,
    // Keep error for debugging test failures
    error: console.error,
    // Mock other console methods
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
