const User = require("../models/userModel");
const AppError = require("../utils/appError");
const crypto = require("crypto");

/**
 * Service layer for user-related operations
 */
class UserService {
  /**
   * Create a new user
   * @param {Object} userData - Data for the new user
   * @returns {Promise<Object>} The created user (without password)
   */
  async createUser(userData) {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    // Create new user
    const user = await User.create(userData);

    // Remove password from output
    user.password = undefined;
    return user;
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} The user data (without password)
   */
  async getUserById(id) {
    const user = await User.findById(id).select("+active");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user is active
    if (!user.active) {
      throw new AppError("This user account has been deactivated", 404);
    }

    user.password = undefined;
    return user;
  }

  /**
   * Update a user's information
   * @param {string} id - User ID
   * @param {Object} updateData - New user data
   * @returns {Promise<Object>} The updated user
   */
  async updateUser(id, updateData) {
    // Prevent password updates through this function
    if (updateData.password) {
      throw new AppError(
        "This route is not for password updates. Please use /updatePassword",
        400
      );
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Apply updates
    Object.assign(user, updateData);
    await user.save({ validateModifiedOnly: true });

    user.password = undefined;
    return user;
  }

  /**
   * Update a user's password
   * @param {string} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} The updated user
   */
  async updatePassword(id, currentPassword, newPassword) {
    // Get user with password field
    const user = await User.findById(id).select("+password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError("Your current password is incorrect", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    user.password = undefined;
    return user;
  }

  /**
   * Deactivate a user account
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  async deactivateUser(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }
  }

  /**
   * Reactivate a user account
   * @param {string} id - User ID
   * @returns {Promise<Object>} The reactivated user
   */
  async reactivateUser(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { active: true },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.password = undefined;
    return user;
  }

  /**
   * Generate a password reset token for a user
   * @param {string} email - User email
   * @returns {Promise<string>} Password reset token
   */
  async createPasswordResetToken(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError("There is no user with this email address", 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    return resetToken;
  }

  /**
   * Reset a user's password using a reset token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async resetPassword(token, newPassword) {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with this token and check if token is still valid
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }
}

module.exports = new UserService();
