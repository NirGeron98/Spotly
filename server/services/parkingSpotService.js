const ParkingSpot = require("../models/parkingSpotModel");
const Building = require("../models/buildingModel"); 
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");
const mongoose = require("mongoose"); // Required for ObjectId generation

// Helper function (consider moving to a utils file)
const combineDateTime = (dateString, timeString) => {
  return new Date(`${dateString}T${timeString}`);
};

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

  if (
    parkingSpot.spot_type === "building" &&
    updateData.hourly_price !== undefined
  ) {
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

  // Update fields
  Object.keys(updateData).forEach((key) => {
    parkingSpot[key] = updateData[key];
  });

  // Save with validation
  await parkingSpot.save();

  return parkingSpot;
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

exports.getOwnerParkingSpots = async (ownerId) => {
  return await ParkingSpot.find({
    owner: ownerId,
  }).populate("user building");
};

exports.getChargingStations = async () => {
  return await ParkingSpot.find({
    is_charging_station: true,
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

// Managing availability schedules
exports.addAvailabilitySchedule = async (spotId, scheduleData, userId) => {
  const { start_datetime, end_datetime } = scheduleData;

  if (
    !start_datetime ||
    !(start_datetime instanceof Date) ||
    isNaN(start_datetime.getTime())
  ) {
    throw new AppError("Invalid start datetime provided.", 400);
  }
  if (
    !end_datetime ||
    !(end_datetime instanceof Date) ||
    isNaN(end_datetime.getTime())
  ) {
    throw new AppError("Invalid end datetime provided.", 400);
  }
  if (end_datetime <= start_datetime) {
    throw new AppError("End datetime must be after start datetime.", 400);
  }

  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (parkingSpot.owner?.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this parking spot's availability",
      403
    );
  }

  const existingSchedules = parkingSpot.availability_schedule || [];
  const hasOverlap = existingSchedules.some((existing) => {
    const existingStart = existing.start_datetime;
    const existingEnd = existing.end_datetime;
    return start_datetime < existingEnd && end_datetime > existingStart;
  });

  if (hasOverlap) {
    throw new AppError(
      "The provided time slot overlaps with an existing availability schedule.",
      400
    );
  }

  const newScheduleEntry = {
    _id: new mongoose.Types.ObjectId(),
    start_datetime,
    end_datetime,
    is_available: true,
  };

  parkingSpot.availability_schedule.push(newScheduleEntry);
  await parkingSpot.save();

  return newScheduleEntry;
};

exports.updateAvailabilitySchedule = async (
  spotId,
  scheduleId,
  scheduleData,
  userId
) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (parkingSpot.owner.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this parking spot's availability",
      403
    );
  }

  const scheduleIndex = parkingSpot.availability_schedule.findIndex(
    (schedule) => schedule._id.toString() === scheduleId
  );

  if (scheduleIndex === -1) {
    throw new AppError("Schedule not found", 404);
  }

  if (scheduleData.start_datetime || scheduleData.end_datetime) {
    if (
      scheduleData.start_datetime &&
      !(scheduleData.start_datetime instanceof Date)
    ) {
      throw new AppError("Invalid start datetime format.", 400);
    }

    if (
      scheduleData.end_datetime &&
      !(scheduleData.end_datetime instanceof Date)
    ) {
      throw new AppError("Invalid end datetime format.", 400);
    }

    const startTime =
      scheduleData.start_datetime ||
      parkingSpot.availability_schedule[scheduleIndex].start_datetime;
    const endTime =
      scheduleData.end_datetime ||
      parkingSpot.availability_schedule[scheduleIndex].end_datetime;

    if (endTime <= startTime) {
      throw new AppError("End datetime must be after start datetime", 400);
    }
  }

  Object.keys(scheduleData).forEach((key) => {
    parkingSpot.availability_schedule[scheduleIndex][key] = scheduleData[key];
  });

  await parkingSpot.save();
  return parkingSpot;
};

exports.removeAvailabilitySchedule = async (spotId, scheduleId, userId) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (parkingSpot.owner.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this parking spot's availability",
      403
    );
  }

  const scheduleIndex = parkingSpot.availability_schedule.findIndex(
    (schedule) => schedule._id.toString() === scheduleId
  );

  if (scheduleIndex === -1) {
    throw new AppError("Schedule not found", 404);
  }

  parkingSpot.availability_schedule.splice(scheduleIndex, 1);
  await parkingSpot.save();

  await Booking.deleteOne({
    spot: spotId,
    schedule: scheduleId,
  });

  return parkingSpot;
};

exports.isSpotAvailableForBooking = async (
  spotId,
  requestedStartTime,
  requestedEndTime
) => {
  if (
    !(requestedStartTime instanceof Date) ||
    !(requestedEndTime instanceof Date) ||
    requestedEndTime <= requestedStartTime
  ) {
    throw new AppError("Invalid requested booking time range.", 400);
  }

  const spot = await ParkingSpot.findById(spotId).select(
    "+availability_schedule"
  );
  if (!spot) {
    throw new AppError("Parking spot not found.", 404);
  }

  const matchingSchedule = spot.availability_schedule?.find(
    (slot) =>
      slot.is_available &&
      requestedStartTime >= slot.start_datetime &&
      requestedEndTime <= slot.end_datetime
  );

  if (!matchingSchedule) {
    return {
      available: false,
      reason: "Time slot not within any available schedule.",
    };
  }

  const conflictingBooking = await Booking.findOne({
    parkingSpot: spotId,
    schedule: matchingSchedule._id,
    status: { $in: ["confirmed", "active", "pending"] },
  });

  if (conflictingBooking) {
    return {
      available: false,
      reason: "Slot is already booked.",
      scheduleId: matchingSchedule._id,
    };
  }

  return { available: true, scheduleId: matchingSchedule._id };
};

// exports.releaseParkingSpot = async (spotData) => {
//   const { date, startTime, endTime, price, type, charger, userId } = spotData;

//   if (!date || !startTime || !endTime || price === undefined || !userId) {
//     throw new AppError("Missing required fields", 400);
//   }

//   const parkingSpot = await ParkingSpot.findOne({
//     owner: userId,
//     spot_type: "private",
//   });

//   if (!parkingSpot) {
//     throw new AppError("No private parking spot found for this user", 404);
//   }

//   const scheduleData = {
//     start_datetime: combineDateTime(date, startTime),
//     end_datetime: combineDateTime(date, endTime),
//     is_available: true,
//   };

//   if (type) scheduleData.type = type;
//   if (charger) scheduleData.charger = charger;

//   if (!parkingSpot.availability_schedule) {
//     parkingSpot.availability_schedule = [];
//   }

//   parkingSpot.availability_schedule.push(scheduleData);

//   parkingSpot.hourly_price = price;

//   if (type === "טעינה לרכב חשמלי") {
//     parkingSpot.is_charging_station = true;
//     parkingSpot.charger_type = charger;
//   }

//   await parkingSpot.save();

//   return parkingSpot;
// };
