const Building = require("../models/buildingModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const mongoose = require("mongoose"); // Added mongoose for transactions

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
  // Start a transaction session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }

    // Check if building exists
    const building = await Building.findById(buildingId).session(session);
    if (!building) {
      throw new AppError("No building found with that ID", 404);
    }

    // Check if user is already a resident in this building
    if (building.residents.includes(userId)) {
      throw new AppError("User is already a resident in this building", 400);
    }

    // Update building - add user to residents
    const updatedBuilding = await Building.findByIdAndUpdate(
      buildingId,
      { $addToSet: { residents: userId } },
      { new: true, runValidators: true, session }
    );

    // Update user - set role and building
    await User.findByIdAndUpdate(
      userId,
      {
        role: "building_resident",
        resident_building: buildingId,
      },
      { new: true, runValidators: true, session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedBuilding;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

exports.removeResident = async (buildingId, userId) => {
  // Start a transaction session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }

    // Check if building exists
    const building = await Building.findById(buildingId).session(session);
    if (!building) {
      throw new AppError("No building found with that ID", 404);
    }

    // Check if user is actually a resident in this building
    if (!building.residents.includes(userId)) {
      throw new AppError("User is not a resident in this building", 400);
    }

    // Update building - remove user from residents
    const updatedBuilding = await Building.findByIdAndUpdate(
      buildingId,
      { $pull: { residents: userId } },
      { new: true, session }
    );

    // Update user - reset resident_building if it matches this building
    const userToUpdate = await User.findById(userId).session(session);
    if (
      userToUpdate.resident_building &&
      userToUpdate.resident_building.toString() === buildingId
    ) {
      await User.findByIdAndUpdate(
        userId,
        {
          // Change role only if user was a building resident
          ...(userToUpdate.role === "building_resident"
            ? { role: "user" }
            : {}),
          $unset: { resident_building: "" },
        },
        { new: true, session }
      );
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedBuilding;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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