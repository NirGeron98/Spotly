const Building = require("../models/buildingModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

// Standard CRUD operations refined to handle errors properly
exports.getAllBuildings = async (filters = {}) => {
  return await Building.find(filters);
};

exports.createBuilding = async (buildingData) => {
  return await Building.create(buildingData);
};

exports.getBuilding = async (id) => {
  const building = await Building.findById(id);
  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }
  return building;
};

exports.updateBuilding = async (id, updateData) => {
  const building = await Building.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }

  return building;
};

exports.deleteBuilding = async (id) => {
  const building = await Building.findByIdAndDelete(id);

  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }

  return building;
};

// Custom business logic - already using AppError correctly
exports.getBuildingById = async (id) => {
  const building = await Building.findById(id);
  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }
  return building;
};

exports.getBuildingByCode = async (code) => {
  const building = await Building.findOne({ building_number: code });
  if (!building) {
    throw new AppError("No building found with that code", 404);
  }
  return building;
};

exports.addResident = async (buildingId, userId) => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  const building = await Building.findByIdAndUpdate(
    buildingId,
    { $addToSet: { residents: userId } },
    { new: true, runValidators: true }
  );

  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }

  return building;
};

exports.removeResident = async (buildingId, userId) => {
  const building = await Building.findByIdAndUpdate(
    buildingId,
    { $pull: { residents: userId } },
    { new: true }
  );

  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }

  return building;
};

exports.updateBuildingResident = async (buildingId, userId, newResidentId) => {
  // Check if the new user exists
  const user = await User.findById(newResidentId);
  if (!user) {
    throw new AppError("No user found with the new resident ID", 404);
  }

  // First remove the old resident
  await Building.findByIdAndUpdate(buildingId, {
    $pull: { residents: userId },
  });

  // Then add the new resident
  const building = await Building.findByIdAndUpdate(
    buildingId,
    { $addToSet: { residents: newResidentId } },
    { new: true, runValidators: true }
  );

  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }

  return building;
};
