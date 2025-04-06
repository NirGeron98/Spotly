const ParkingSpot = require("../models/parkingSpotModel");
const Building = require("../models/buildingModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");

exports.createParkingSpot = async (parkingSpotData) => {
  // Validate based on spot_type
  if (parkingSpotData.spot_type === "building") {
    const building = await Building.findById(parkingSpotData.building);
    if (!building) {
      throw new AppError("Building not found", 404);
    }

    const existingSpot = await ParkingSpot.findOne({
      building: parkingSpotData.building,
      spot_number: parkingSpotData.spot_number,
      floor: parkingSpotData.floor,
    });

    if (existingSpot) {
      throw new AppError(
        "A parking spot with this number and floor already exists in this building",
        400
      );
    }
  } else if (parkingSpotData.spot_type === "private") {
    if (
      parkingSpotData.is_available &&
      !parkingSpotData.hourly_price &&
      parkingSpotData.hourly_price !== 0
    ) {
      throw new AppError(
        "Private parking spots must have an hourly price when available for rent",
        400
      );
    }

    if (parkingSpotData.is_charging_station && !parkingSpotData.charger_type) {
      throw new AppError(
        "Charging stations must specify their charger type",
        400
      );
    }
  } else {
    throw new AppError("Invalid parking spot type", 400);
  }

  return await ParkingSpot.create(parkingSpotData);
};

exports.getParkingSpotById = async (id) => {
  const parkingSpot = await ParkingSpot.findById(id);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }
  return parkingSpot;
};

exports.getAllParkingSpots = async (filters = {}) => {
  return await ParkingSpot.find(filters);
};

exports.getParkingSpotsByBuilding = async (buildingId) => {
  const building = await Building.findById(buildingId);
  if (!building) {
    throw new AppError("Building not found", 404);
  }

  return await ParkingSpot.find({
    building: buildingId,
    spot_type: "building",
  }).populate("user");
};

exports.updateParkingSpot = async (id, updateData, userId, userRole) => {
  const parkingSpot = await ParkingSpot.findById(id);

  if (!parkingSpot) {
    throw new AppError("No parking spot found with that ID", 404);
  }

  if (
    parkingSpot.owner.toString() !== userId &&
    !["admin", "building_manager"].includes(userRole)
  ) {
    throw new AppError(
      "You do not have permission to update this parking spot",
      403
    );
  }

  if (updateData.spot_type && updateData.spot_type !== parkingSpot.spot_type) {
    throw new AppError("Cannot change the type of a parking spot", 400);
  }

  if (parkingSpot.spot_type === "building" && updateData.hourly_price) {
    throw new AppError(
      "Cannot set hourly price for building parking spots",
      400
    );
  }

  if (
    updateData.is_charging_station &&
    !updateData.charger_type &&
    !parkingSpot.charger_type
  ) {
    throw new AppError(
      "Charging stations must specify their charger type",
      400
    );
  }

  return await ParkingSpot.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

exports.deleteParkingSpot = async (id, userId, userRole) => {
  const parkingSpot = await ParkingSpot.findById(id);

  if (!parkingSpot) {
    throw new AppError("No parking spot found with that ID", 404);
  }

  if (
    parkingSpot.owner.toString() !== userId &&
    !["admin", "building_manager"].includes(userRole)
  ) {
    throw new AppError(
      "You do not have permission to delete this parking spot",
      403
    );
  }

  if (parkingSpot.user) {
    throw new AppError(
      "Cannot delete a parking spot that is currently in use",
      400
    );
  }

  const futureBookings = await Booking.find({
    parkingSpot: id,
    endTime: { $gt: new Date() },
  });

  if (futureBookings.length > 0) {
    throw new AppError("Cannot delete parking spot with active bookings", 400);
  }

  await ParkingSpot.findByIdAndDelete(id);
};

exports.assignUser = async (spotId, userId) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (parkingSpot.user) {
    throw new AppError("This parking spot is already occupied", 400);
  }

  if (!parkingSpot.is_available) {
    throw new AppError("This parking spot is not available", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (parkingSpot.spot_type === "building") {
    if (user.role !== "building_resident") {
      throw new AppError(
        "Only building residents can be assigned to building parking spots",
        400
      );
    }

    if (parkingSpot.building.toString() !== user.building?.toString()) {
      throw new AppError("User must be a resident of the same building", 400);
    }
  }

  parkingSpot.user = userId;
  await parkingSpot.save();

  user.parking_spot = parkingSpot._id;
  await user.save({ validateBeforeSave: false });

  return parkingSpot;
};

exports.unassignUser = async (spotId) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (!parkingSpot.user) {
    throw new AppError("This parking spot is already unassigned", 400);
  }

  const user = await User.findById(parkingSpot.user);
  if (user) {
    user.parking_spot = undefined;
    await user.save({ validateBeforeSave: false });
  }

  parkingSpot.user = undefined;
  await parkingSpot.save();

  return parkingSpot;
};

exports.toggleAvailability = async (spotId, isAvailable, userId, userRole) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (
    parkingSpot.owner.toString() !== userId &&
    !["admin", "building_manager"].includes(userRole)
  ) {
    throw new AppError(
      "You do not have permission to update this parking spot",
      403
    );
  }

  if (parkingSpot.user && isAvailable === false) {
    throw new AppError(
      "Cannot change availability of an occupied parking spot",
      400
    );
  }

  parkingSpot.is_available = isAvailable;
  await parkingSpot.save();

  return parkingSpot;
};

exports.getAvailablePrivateSpots = async () => {
  return await ParkingSpot.find({
    spot_type: "private",
    is_available: true,
    user: { $exists: false },
  }).populate("owner");
};

exports.getOwnerParkingSpots = async (ownerId) => {
  return await ParkingSpot.find({
    owner: ownerId,
  }).populate("user building");
};

exports.getChargingStations = async () => {
  return await ParkingSpot.find({
    is_charging_station: true,
    is_available: true,
  }).populate("owner");
};

exports.getAvailableParkingSpots = async (startTime, endTime, filters = {}) => {
  const allSpots = await exports.getAllParkingSpots(filters);

  const bookedSpotIds = await Booking.distinct("parkingSpot", {
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
    ],
    status: { $ne: "canceled" },
  });

  return allSpots.filter(
    (spot) => !bookedSpotIds.some((id) => id.toString() === spot._id.toString())
  );
};
