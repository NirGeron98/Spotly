/**
 * Mock user data for testing
 */
const users = {
  validUser: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    password: "password123",
    passwordConfirm: "password123",
    role: "user",
  },
  adminUser: {
    first_name: "Admin",
    last_name: "User",
    email: "admin@example.com",
    password: "admin123456",
    passwordConfirm: "admin123456",
    role: "admin",
  },
  buildingManagerUser: {
    first_name: "Building",
    last_name: "Manager",
    email: "manager@example.com",
    password: "manager123",
    passwordConfirm: "manager123",
    role: "building_manager",
  },
  invalidUser: {
    first_name: "Invalid",
    last_name: "User",
    email: "invalid-email",
    password: "123",
    passwordConfirm: "456",
  },
};

/**
 * Mock tokens for testing
 */
const tokens = {
  validToken: "valid-reset-token",
  expiredToken: "expired-reset-token",
  invalidToken: "invalid-token",
};

module.exports = {
  users,
  tokens,
};
