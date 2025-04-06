const User = require("../models/userModel");
const factory = require("../controllers/handlerFactory");
const AppError = require("../utils/appError");
const { filterObj } = require("../utils/filterObj");

// Service functions with proper error handling
exports.getAllUsers = async (filters = {}) => {
  return await User.find(filters);
};

exports.getUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  return user;
};

exports.updateUser = async (id, updateData) => {
  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  return user;
};

// User-specific business logic
exports.updateMe = async (userId, userData) => {
  // Filter out unwanted fields
  const filteredBody = filterObj(
    userData,
    "first_name",
    "last_name",
    "email",
    "phone_number"
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
  const user = await User.findByIdAndUpdate(userId, { active: false });

  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  return true;
};
