const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

/**
 * Create and connect to an in-memory MongoDB instance for testing
 * @returns {Promise<MongoMemoryServer>} MongoDB memory server instance
 */
const setupTestDB = async () => {
  // Create in-memory MongoDB server
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect Mongoose to the in-memory database
  await mongoose.connect(mongoUri);

  return mongoServer;
};

/**
 * Disconnect from the test database and stop the MongoDB memory server
 * @param {MongoMemoryServer} mongoServer - MongoDB memory server instance
 */
const teardownTestDB = async (mongoServer) => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

/**
 * Generate a JWT token for testing authentication
 * @param {Object} user - User object or ID
 * @returns {string} JWT token
 */
const generateAuthToken = (user) => {
  const userId = typeof user === "object" ? user._id || user.id : user;

  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "test-jwt-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

/**
 * Create mock request and response objects for controller unit testing
 * @returns {Object} Object containing req, res, and next mocks
 */
const createMockRequestResponse = () => {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };

  const next = jest.fn();

  return { req, res, next };
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  generateAuthToken,
  createMockRequestResponse,
};
