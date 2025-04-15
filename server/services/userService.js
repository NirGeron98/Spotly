const User = require("../models/userModel");
const AppError = require("../utils/appError");
const { filterObj } = require("../utils/filterObj");

// User-specific business logic
exports.updateMe = async (userId, userData) => {
  // Filter out unwanted fields
  const filteredBody = filterObj(
    userData,
    "first_name",
    "last_name",
    "email",
    "phone_number",
  );

  const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new AppError("No user found with that ID", 404);
  }

  return updatedUser;
};

exports.deactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { is_active: false });
  console.log(user.is_active);
  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  return true;
};

exports.updatePreferences = async (userId, preferences) => {
  // Validate preference values
  if (preferences.distance_importance && (preferences.distance_importance < 1 || preferences.distance_importance > 5)) {
    throw new AppError('Distance importance must be between 1 and 5', 400);
  }
  if (preferences.price_importance && (preferences.price_importance < 1 || preferences.price_importance > 5)) {
    throw new AppError('Price importance must be between 1 and 5', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { 
      'preferences.distance_importance': preferences.distance_importance,
      'preferences.price_importance': preferences.price_importance
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedUser) {
    throw new AppError('No user found with that ID', 404);
  }

  return updatedUser;
};