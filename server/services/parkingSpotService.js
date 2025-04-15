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

// Managing availability schedules
exports.addAvailabilitySchedule = async (spotId, scheduleData, userId) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  // Check if user is owner of the parking spot
  if (parkingSpot.owner.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this parking spot's availability",
      403
    );
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (
    !timeRegex.test(scheduleData.start_time) ||
    !timeRegex.test(scheduleData.end_time)
  ) {
    throw new AppError(
      "Invalid time format. Use HH:MM in 24-hour format.",
      400
    );
  }

  // Validate date format
  if (!scheduleData.date) {
    throw new AppError("Date is required", 400);
  }

  // Ensure date is a valid Date object
  const scheduleDate = new Date(scheduleData.date);
  if (isNaN(scheduleDate.getTime())) {
    throw new AppError("Invalid date format", 400);
  }

  // Validate that end time is after start time
  const [startHour, startMinute] = scheduleData.start_time
    .split(":")
    .map(Number);
  const [endHour, endMinute] = scheduleData.end_time.split(":").map(Number);

  if (
    endHour < startHour ||
    (endHour === startHour && endMinute <= startMinute)
  ) {
    throw new AppError("End time must be after start time", 400);
  }

  // Initialize availability_schedule if it doesn't exist
  if (!parkingSpot.availability_schedule) {
    parkingSpot.availability_schedule = [];
  }

  // Check for overlapping schedules on the same date
  const sameDate = parkingSpot.availability_schedule.filter((schedule) => {
    // Compare dates by converting to ISO string date parts
    const existingDate = new Date(schedule.date);
    const newDate = new Date(scheduleData.date);
    return (
      existingDate.getFullYear() === newDate.getFullYear() &&
      existingDate.getMonth() === newDate.getMonth() &&
      existingDate.getDate() === newDate.getDate()
    );
  });

  for (const existing of sameDate) {
    const existingStart = existing.start_time.split(":").map(Number);
    const existingEnd = existing.end_time.split(":").map(Number);

    const existingStartMinutes = existingStart[0] * 60 + existingStart[1];
    const existingEndMinutes = existingEnd[0] * 60 + existingEnd[1];
    const newStartMinutes = startHour * 60 + startMinute;
    const newEndMinutes = endHour * 60 + endMinute;

    // Check for overlap
    if (
      (newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes) ||
      (existingStartMinutes < newEndMinutes &&
        existingEndMinutes > newStartMinutes)
    ) {
      const formattedDate = new Date(scheduleData.date).toLocaleDateString();
      throw new AppError(
        `This schedule overlaps with existing availability on ${formattedDate}`,
        400
      );
    }
  }

  // Add the new schedule
  parkingSpot.availability_schedule.push(scheduleData);
  await parkingSpot.save();

  return parkingSpot;
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

  // Check if user is owner of the parking spot
  if (parkingSpot.owner.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this parking spot's availability",
      403
    );
  }

  // Find the schedule to update
  const scheduleIndex = parkingSpot.availability_schedule.findIndex(
    (schedule) => schedule._id.toString() === scheduleId
  );

  if (scheduleIndex === -1) {
    throw new AppError("Schedule not found", 404);
  }

  // Validate time format if provided
  if (scheduleData.start_time || scheduleData.end_time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (scheduleData.start_time && !timeRegex.test(scheduleData.start_time)) {
      throw new AppError(
        "Invalid start time format. Use HH:MM in 24-hour format.",
        400
      );
    }

    if (scheduleData.end_time && !timeRegex.test(scheduleData.end_time)) {
      throw new AppError(
        "Invalid end time format. Use HH:MM in 24-hour format.",
        400
      );
    }

    // Validate date if provided
    if (scheduleData.date) {
      const scheduleDate = new Date(scheduleData.date);
      if (isNaN(scheduleDate.getTime())) {
        throw new AppError("Invalid date format", 400);
      }
    }

    // Use either new values or existing values for validation
    const startTime =
      scheduleData.start_time ||
      parkingSpot.availability_schedule[scheduleIndex].start_time;
    const endTime =
      scheduleData.end_time ||
      parkingSpot.availability_schedule[scheduleIndex].end_time;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    if (
      endHour < startHour ||
      (endHour === startHour && endMinute <= startMinute)
    ) {
      throw new AppError("End time must be after start time", 400);
    }
  }

  // Update the schedule
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

  // Check if user is owner of the parking spot
  if (parkingSpot.owner.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this parking spot's availability",
      403
    );
  }

  // Find and remove the schedule
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

exports.isSpotAvailableForBooking = async (spotId, startTime, endTime) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  // If it's not a private spot, just check if it's available and not occupied
  if (parkingSpot.spot_type !== "private") {
    return !parkingSpot.user; // Not occupied
  }

  // For private spots, if no availability schedules are defined,
  // consider the spot as generally available in all time periods
  if (
    !parkingSpot.availability_schedule ||
    parkingSpot.availability_schedule.length === 0
  ) {
    // Check only for conflicting bookings when no schedules are defined
    const existingBookings = await Booking.find({
      spot: spotId,
      status: { $ne: "cancelled" },
      $or: [
        { start_datetime: { $lt: bookingEnd, $gte: bookingStart } },
        { end_datetime: { $gt: bookingStart, $lte: bookingEnd } },
        {
          start_datetime: { $lte: bookingStart },
          end_datetime: { $gte: bookingEnd },
        },
      ],
    });

    return existingBookings.length === 0;
  }

  // Convert booking times to Date objects if they're strings
  const bookingStart =
    startTime instanceof Date ? startTime : new Date(startTime);
  const bookingEnd = endTime instanceof Date ? endTime : new Date(endTime);

  // Check each day in the booking period
  const oneDayMillis = 24 * 60 * 60 * 1000;

  // Loop through each day in the booking period
  for (
    let currentDate = new Date(bookingStart);
    currentDate <= bookingEnd;
    currentDate = new Date(currentDate.getTime() + oneDayMillis)
  ) {
    // Format the current date to year-month-day for comparison
    const currentDateString = currentDate.toISOString().split("T")[0];

    // Find schedules for this date
    const dateSchedules = parkingSpot.availability_schedule.filter((s) => {
      const scheduleDate = new Date(s.date);
      return (
        scheduleDate.toISOString().split("T")[0] === currentDateString &&
        s.is_available
      );
    });

    if (dateSchedules.length === 0) {
      return false; // No availability for this date
    }

    // Check each schedule for this date
    let dateAvailable = false;
    for (const schedule of dateSchedules) {
      const [startHour, startMinute] = schedule.start_time
        .split(":")
        .map(Number);
      const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

      // Create Date objects for the schedule times on this day
      const scheduleStart = new Date(currentDate);
      scheduleStart.setHours(startHour, startMinute, 0);

      const scheduleEnd = new Date(currentDate);
      scheduleEnd.setHours(endHour, endMinute, 0);

      // Check if booking time is within this schedule
      // For first day, check only bookingStart
      // For last day, check only bookingEnd
      // For days in between, the whole day should be available
      if (currentDate.toDateString() === bookingStart.toDateString()) {
        if (bookingStart >= scheduleStart && bookingStart < scheduleEnd) {
          dateAvailable = true;
          break;
        }
      } else if (currentDate.toDateString() === bookingEnd.toDateString()) {
        if (bookingEnd > scheduleStart && bookingEnd <= scheduleEnd) {
          dateAvailable = true;
          break;
        }
      } else {
        // Days in between should be fully covered by the schedule
        if (
          scheduleStart.getHours() <= 0 &&
          scheduleStart.getMinutes() <= 0 &&
          scheduleEnd.getHours() >= 23 &&
          scheduleEnd.getMinutes() >= 59
        ) {
          dateAvailable = true;
          break;
        }
      }
    }

    if (!dateAvailable) {
      return false;
    }
  }

  // Check if there are any overlapping bookings
  const existingBookings = await Booking.find({
    spot: spotId,
    status: { $ne: "cancelled" },
    $or: [
      { start_datetime: { $lt: bookingEnd, $gte: bookingStart } },
      { end_datetime: { $gt: bookingStart, $lte: bookingEnd } },
      {
        start_datetime: { $lte: bookingStart },
        end_datetime: { $gte: bookingEnd },
      },
    ],
  });

  return existingBookings.length === 0;
};

exports.releaseParkingSpot = async (spotData) => {
  const { date, startTime, endTime, price, type, charger, userId } = spotData;

  if (!date || !startTime || !endTime || price === undefined || !userId) {
    throw new AppError("Missing required fields", 400);
  }

  const parkingSpot = await ParkingSpot.findOne({
    owner: userId,
    spot_type: "private",
  });

  if (!parkingSpot) {
    throw new AppError("No private parking spot found for this user", 404);
  }

  const scheduleData = {
    date,
    start_time: startTime,
    end_time: endTime,
    is_available: true,
  };

  if (type) scheduleData.type = type;
  if (charger) scheduleData.charger = charger;

  if (!parkingSpot.availability_schedule) {
    parkingSpot.availability_schedule = [];
  }

  parkingSpot.availability_schedule.push(scheduleData);

  parkingSpot.hourly_price = price;

  if (type === "טעינה לרכב חשמלי") {
    parkingSpot.is_charging_station = true;
    parkingSpot.charger_type = charger;
  }

  await parkingSpot.save();

  return parkingSpot;
};
