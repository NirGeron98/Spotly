const Spot = require("../models/spotModel");
const factory = require("../controllers/handlerFactory");
const AppError = require("../utils/appError");

// Refactored service functions with proper error handling
exports.getAllSpots = async (filters = {}) => {
  return await Spot.find(filters);
};

exports.createSpot = async (spotData) => {
  return await Spot.create(spotData);
};

exports.getSpot = async (id) => {
  const spot = await Spot.findById(id);

  if (!spot) {
    throw new AppError("No spot found with that ID", 404);
  }

  return spot;
};

exports.updateSpot = async (id, updateData) => {
  const spot = await Spot.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!spot) {
    throw new AppError("No spot found with that ID", 404);
  }

  return spot;
};

exports.deleteSpot = async (id) => {
  const spot = await Spot.findByIdAndDelete(id);

  if (!spot) {
    throw new AppError("No spot found with that ID", 404);
  }

  return spot;
};

// Add any spot-specific business logic here
