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

// exports.getParkingSpotsByBuilding = async (buildingId) => {
//   const building = await Building.findById(buildingId);
//   if (!building) {
//     throw new AppError("Building not found", 404);
//   }

//   return await ParkingSpot.find({
//     building: buildingId,
//     spot_type: "building",
//   }).populate("user");
// };

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

exports.findAvailableBuildingSpot = async (
  buildingId,
  startTime,
  endTime,
  userId
) => {
  // Find a user's assigned spot first
  const userAssignedSpot = await ParkingSpot.findOne({
    building: buildingId,
    spot_type: "building",
    user: userId,
  });

  // find any available spot in the building
  const buildingSpots = await ParkingSpot.find({
    building: buildingId,
    spot_type: "building",
  });

  // Check each spot for availability
  for (const spot of buildingSpots) {
    const isAvailable = await exports.isSpotAvailableForBooking(
      spot._id,
      startTime,
      endTime
    );

    if (isAvailable.available) {
      return spot;
    }
  }

  // No available spots found
  return null;
};

/**
 * Marks an existing availability schedule slot as booked and splits it if necessary.
 * This function is called within the createBooking transaction.
 *
 * @param {string} spotId - The ID of the parking spot.
 * @param {string} originalScheduleId - The ID of the availability_schedule entry that covers the booking.
 * @param {Date} bookingStartTime - The start time of the booking (UTC).
 * @param {Date} bookingEndTime - The end time of the booking (UTC).
 * @param {string} bookingId - The ID of the newly created booking.
 * @param {Object} options - Options object, e.g., { session } for transactions.
 * @returns {Promise<void>}
 */
exports.markScheduleAsBookedAndSplit = async (
  spotId,
  originalScheduleId,
  bookingStartTime,
  bookingEndTime,
  bookingId,
  options = {}
) => {
  const { session } = options;

  // Fetch the parking spot using the session
  const spot = await ParkingSpot.findById(spotId).session(session);
  if (!spot) {
    throw new AppError("Parking spot not found during booking update", 404);
  }

  const scheduleIndex = spot.availability_schedule.findIndex(
    (s) => s._id.toString() === originalScheduleId
  );

  if (scheduleIndex === -1) {
    throw new AppError("Original availability schedule not found for booking", 404);
  }

  const originalSchedule = spot.availability_schedule[scheduleIndex];

  // Store the original start and end times and type before modifying
  const originalStart = new Date(originalSchedule.start_datetime);
  const originalEnd = new Date(originalSchedule.end_datetime);
  const scheduleType = originalSchedule.type;

  // 1. Update the original schedule entry to represent the booked slot
  originalSchedule.is_available = false;
  originalSchedule.booking_id = bookingId;
  // Adjust its start and end to match the booking precisely
  originalSchedule.start_datetime = bookingStartTime;
  originalSchedule.end_datetime = bookingEndTime;

  const newSchedulesToAdd = [];

  // 2. Create a new schedule for the part *before* the booking, if any
  if (originalStart < bookingStartTime) {
    newSchedulesToAdd.push({
      _id: new mongoose.Types.ObjectId(), // Generate new ID
      start_datetime: originalStart,
      end_datetime: bookingStartTime,
      is_available: true,
      type: scheduleType, // Retain the original type
      booking_id: null,
    });
  }

  // 3. Create a new schedule for the part *after* the booking, if any
  if (originalEnd > bookingEndTime) {
    newSchedulesToAdd.push({
      _id: new mongoose.Types.ObjectId(), // Generate new ID
      start_datetime: bookingEndTime,
      end_datetime: originalEnd,
      is_available: true,
      type: scheduleType, // Retain the original type
      booking_id: null,
    });
  }

  // Add the new schedule fragments to the availability_schedule array
  if (newSchedulesToAdd.length > 0) {
    spot.availability_schedule.push(...newSchedulesToAdd);
  }

  // Save the parking spot with all changes
  await spot.save({ session }); // Pass the session here
};

/**
 * Restores an availability window when a booking is canceled.
 * This function marks the specific booked schedule slot as available again.
 * It is followed by optimizeAvailabilitySchedules to merge adjacent slots.
 *
 * @param {string} spotId - The ID of the parking spot.
 * @param {string} bookedScheduleId - The ID of the availability_schedule entry linked to the canceled booking.
 * @param {Object} options - Options object, e.g., { session } for transactions.
 * @returns {Promise<Object|null>} The updated schedule entry or null if not found.
 */
exports.restoreSchedule = async (spotId, bookedScheduleId, options = {}) => {
  const { session } = options;
  console.log(`Attempting to restore schedule ${bookedScheduleId} for spot ${spotId} within transaction.`);

  const spot = await ParkingSpot.findById(spotId).session(session);
  if (!spot) {
    // This should ideally not happen if called within a transaction that already fetched the spot
    throw new AppError("Parking spot not found during schedule restoration", 404);
  }

  const scheduleIndex = spot.availability_schedule.findIndex(
    (s) => s._id.toString() === bookedScheduleId
  );

  if (scheduleIndex === -1) {
    // This indicates a potential issue, as the booked schedule should exist.
    // It might be that the schedule was already merged or removed, which needs careful handling.
    // For now, we'll throw an error. Depending on the desired behavior,
    // you might want to create a new availability window based on booking times.
    console.error(`Booked schedule ${bookedScheduleId} not found in spot ${spotId} for restoration.`);
    throw new AppError(`Booked schedule ${bookedScheduleId} not found for restoration.`, 404);
  }

  const scheduleToRestore = spot.availability_schedule[scheduleIndex];

  // Ensure it's actually linked to a booking and is not available
  if (scheduleToRestore.is_available || !scheduleToRestore.booking_id) {
    // This could happen if cancellation is attempted twice or if data is inconsistent.
    console.warn(`Schedule ${bookedScheduleId} is already available or not linked to a booking.`);
    // Depending on strictness, you might throw an error or just return.
    // For now, let's proceed to mark it available to ensure correct state.
  }

  scheduleToRestore.is_available = true;
  scheduleToRestore.booking_id = null; // Remove the link to the booking

  // The actual merging will be handled by optimizeAvailabilitySchedules
  // Save is called after optimization.
  console.log(`Schedule ${bookedScheduleId} marked as available. Optimization will follow.`);
  // We don't save here; optimizeAvailabilitySchedules will save.
  return scheduleToRestore; // Return the modified (but not yet saved) schedule
};

/**
 * Optimizes the availability_schedule array by merging adjacent and available time slots of the same type.
 * Also removes any duplicate or fully overlapped windows.
 *
 * @param {string} spotId - The ID of the parking spot.
 * @param {Object} options - Options object, e.g., { session } for transactions.
 * @returns {Promise<ParkingSpot>} The updated parking spot document.
 */
exports.optimizeAvailabilitySchedules = async (spotId, options = {}) => {
  const { session } = options;
  console.log(`Optimizing availability schedules for spot: ${spotId} within transaction.`);

  const spot = await ParkingSpot.findById(spotId).session(session);
  if (!spot) {
    throw new AppError("Parking spot not found for optimization", 404);
  }

  if (!spot.availability_schedule || spot.availability_schedule.length === 0) {
    console.log("No schedules to optimize.");
    return spot; // No schedules to optimize
  }

  let schedules = spot.availability_schedule;

  // 1. Filter out invalid schedules (e.g., end <= start) - Defensive coding
  schedules = schedules.filter(s => s.start_datetime < s.end_datetime);

  // 2. Sort schedules by start_datetime primarily, and then by end_datetime for tie-breaking
  // This helps in processing them in chronological order for merging.
  schedules.sort((a, b) => {
    if (a.start_datetime.getTime() !== b.start_datetime.getTime()) {
      return a.start_datetime.getTime() - b.start_datetime.getTime();
    }
    return a.end_datetime.getTime() - b.end_datetime.getTime();
  });

  const optimizedSchedules = [];
  if (schedules.length === 0) {
      spot.availability_schedule = [];
      await spot.save({ session });
      return spot;
  }

  // Initialize with the first schedule
  let currentMergeCandidate = { ...schedules[0].toObject() }; // Work with a copy

  for (let i = 1; i < schedules.length; i++) {
    const nextSchedule = schedules[i].toObject(); // Work with a copy

    // Check for merge condition:
    // - Both are available
    // - Same type
    // - currentMergeCandidate.end_datetime is a Date object
    // - nextSchedule.start_datetime is a Date object
    // - They are adjacent or overlapping (current ends when or after next starts)
    //   A small tolerance (e.g., 1 millisecond) can be added for exact adjacency if needed.
    //   `currentMergeCandidate.end_datetime >= nextSchedule.start_datetime` allows for overlapping or touching.
    //   If strict adjacency (touching, not overlapping) is required: `currentMergeCandidate.end_datetime.getTime() === nextSchedule.start_datetime.getTime()`
    if (
      currentMergeCandidate.is_available &&
      nextSchedule.is_available &&
      currentMergeCandidate.type === nextSchedule.type &&
      currentMergeCandidate.end_datetime instanceof Date && // Ensure it's a Date
      nextSchedule.start_datetime instanceof Date && // Ensure it's a Date
      currentMergeCandidate.end_datetime.getTime() >= nextSchedule.start_datetime.getTime() // Allows merging if touching or overlapping
    ) {
      // Merge: Extend the end_datetime of the current candidate if next one ends later
      if (nextSchedule.end_datetime > currentMergeCandidate.end_datetime) {
        currentMergeCandidate.end_datetime = nextSchedule.end_datetime;
      }
      // If they are perfectly identical (start, end, type, availability), the loop will just skip the next one.
    } else {
      // No merge possible, push the current candidate to results
      optimizedSchedules.push(currentMergeCandidate);
      // Start a new merge candidate
      currentMergeCandidate = { ...nextSchedule };
    }
  }

  // Add the last merge candidate
  optimizedSchedules.push(currentMergeCandidate);


  // Prevent duplicate windows:
  // This step is more robust after sorting and initial merging.
  // A duplicate here means two entries that are exactly identical after the merge pass.
  const finalSchedules = [];
  if (optimizedSchedules.length > 0) {
    finalSchedules.push(optimizedSchedules[0]); // Add the first one
    for (let i = 1; i < optimizedSchedules.length; i++) {
      const prev = finalSchedules[finalSchedules.length - 1];
      const current = optimizedSchedules[i];
      // Check if current is NOT identical to the previous one added
      if (
        prev.start_datetime.getTime() !== current.start_datetime.getTime() ||
        prev.end_datetime.getTime() !== current.end_datetime.getTime() ||
        prev.is_available !== current.is_available ||
        prev.type !== current.type ||
        (prev.booking_id ? prev.booking_id.toString() : null) !== (current.booking_id ? current.booking_id.toString() : null)
      ) {
        finalSchedules.push(current);
      }
    }
  }


  spot.availability_schedule = finalSchedules;
  await spot.save({ session });
  console.log(`Optimization complete for spot ${spotId}. Schedules count: ${spot.availability_schedule.length}`);
  return spot;
};

