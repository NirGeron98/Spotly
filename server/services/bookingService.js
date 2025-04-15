const Booking = require("../models/bookingModel");
const ParkingSpot = require("../models/parkingSpotModel");
const AppError = require("../utils/appError");

/**
 * Create a new booking
 * @param {Object} bookingData - Data for the new booking
 * @returns {Promise<Object>} The created booking
 */
exports.createBooking = async (bookingData) => {
  // Check if the parking spot exists and is available for the requested time
  const parkingSpot = await ParkingSpot.findById(bookingData.spot);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  // Check availability with corrected parameter names
  const isAvailable = await exports.checkParkingSpotAvailability(
    bookingData.spot,
    bookingData.start_datetime,
    bookingData.end_datetime
  );

  if (!isAvailable) {
    throw new AppError(
      "Parking spot is not available for the requested time period",
      400
    );
  }

  // Create booking
  const booking = await Booking.create(bookingData);
  return booking;
};

/**
 * Get a booking by ID
 * @param {string} id - Booking ID
 * @returns {Promise<Object>} The booking data
 */
exports.getBookingById = async (id) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  return booking;
};

/**
 * Get all bookings for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of bookings
 */
exports.getUserBookings = async (userId) => {
  return await Booking.find({ user: userId });
};

/**
 * Check if a parking spot is available during a specific time period
 * @param {string} spotId - Parking spot ID
 * @param {Date} startTime - Start time of the period to check
 * @param {Date} endTime - End time of the period to check
 * @returns {Promise<boolean>} Whether the spot is available
 */
exports.checkParkingSpotAvailability = async (
  spotId,
  startTime,
  endTime
) => {
  // If no end time is provided, consider it available
  if (!endTime) return true;

  // Find any overlapping bookings
  const overlappingBookings = await Booking.find({
    spot: spotId,
    status: "active",
    $or: [
      { start_datetime: { $lt: endTime, $gte: startTime } },
      { end_datetime: { $gt: startTime, $lte: endTime } },
      { 
        start_datetime: { $lte: startTime }, 
        end_datetime: { $gte: endTime }
      },
    ],
  });

  return overlappingBookings.length === 0;
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @param {string} userId - ID of the user attempting to cancel
 * @returns {Promise<Object>} The canceled booking
 */
exports.cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Verify that the user owns this booking
  if (booking.user.toString() !== userId) {
    throw new AppError(
      "You do not have permission to cancel this booking",
      403
    );
  }

  // Check if the booking can be canceled (e.g., not already started)
  const now = new Date();
  if (booking.start_datetime <= now) {
    throw new AppError("Cannot cancel a booking that has already started", 400);
  }

  booking.status = "canceled";
  await booking.save();

  return booking;
};

/**
 * Update a booking
 * @param {string} bookingId - Booking ID
 * @param {Object} updateData - New booking data
 * @param {string} userId - ID of the user attempting to update
 * @returns {Promise<Object>} The updated booking
 */
exports.updateBooking = async (bookingId, updateData, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Verify that the user owns this booking
  if (booking.user.toString() !== userId) {
    throw new AppError(
      "You do not have permission to update this booking",
      403
    );
  }

  // If changing dates, check availability
  if (updateData.start_datetime || updateData.end_datetime) {
    const isAvailable = await exports.checkParkingSpotAvailability(
      booking.spot,
      updateData.start_datetime || booking.start_datetime,
      updateData.end_datetime || booking.end_datetime
    );

    if (!isAvailable) {
      throw new AppError(
        "Parking spot is not available for the requested time period",
        400
      );
    }
  }

  Object.assign(booking, updateData);
  await booking.save();

  return booking;
};
