const Booking = require("../models/bookingModel");
const ParkingSpot = require("../models/parkingSpotModel");
const AppError = require("../utils/appError");

/**
 * Create a new booking
 * @param {Object} bookingData - Data for the new booking
 * @returns {Promise<Object>} The created booking
 */
exports.createBooking = async (
  userId,
  spotId,
  requestedStartTime,
  requestedEndTime,
  bookingDetails, // { booking_type, base_rate_override, pmsInstance (if resident) }
) => {
  const session = await mongoose.startSession();
  let newBookingDocument = null;

  try {
    await session.withTransaction(async (sess) => {
      const spot = await ParkingSpot.findById(spotId).session(sess);
      if (!spot) {
        throw new AppError('Parking spot not found.', 404);
      }

      let booking_source;
      let final_base_rate;
      let initial_payment_status = 'pending';

      if (spot.spot_type === 'private') {
        booking_source = 'private_spot_rental';
        final_base_rate = bookingDetails.base_rate_override !== undefined
          ? bookingDetails.base_rate_override
          : spot.hourly_price; // Or your pricing logic for private spots
        if (final_base_rate === undefined || final_base_rate === null) {
            throw new AppError('Base rate for private spot booking is not defined.', 400);
        }
      } else if (spot.spot_type === 'building_resident') {
        booking_source = 'resident_building_allocation';
        final_base_rate = 0; // No charge for residents
        initial_payment_status = 'not_applicable';
      } else {
        throw new AppError(`Booking not supported for spot type: ${spot.spot_type}.`, 400);
      }

      const bookingPayload = {
        user: userId,
        spot: spot._id,
        start_datetime: requestedStartTime,
        end_datetime: requestedEndTime,
        booking_type: bookingDetails.booking_type || spot.default_booking_type || 'parking',
        base_rate: final_base_rate,
        // final_amount will be calculated or set by payment process for private
        // For resident, it will remain 0 if base_rate is 0
        status: 'active', // Or 'pending_confirmation' if you have such a flow
        payment_status: initial_payment_status,
        booking_source,
      };

      const createdBookings = await Booking.create([bookingPayload], { session: sess });
      newBookingDocument = createdBookings[0];

      // Delegate availability update
      if (spot.spot_type === 'private') {
        await parkingSpotService.updateAvailabilityForPrivateSpotBooking(
          spot._id,
          newBookingDocument._id,
          requestedStartTime,
          requestedEndTime,
          { session: sess }, // Pass session for transaction
        );
      } else if (spot.spot_type === 'building_resident') {
        if (!bookingDetails.pmsInstance || !bookingDetails.pmsInstance.isLoaded) {
          // Attempt to load PMS if not ready (this is a simplified on-demand load)
          if (bookingDetails.pmsInstance) {
            try {
                await bookingDetails.pmsInstance.loadFromDatabase(); // Ensure PMS is ready
            } catch (pmsLoadError) {
                console.error("Failed to load PMS data on demand during booking (bookingService):", pmsLoadError);
                throw new AppError("System is initializing, please try again shortly.", 503);
            }
          } else {
             throw new AppError('Parking Management System instance not provided for resident booking.', 500);
          }
          if (!bookingDetails.pmsInstance.isLoaded) {
             throw new AppError("System is not ready, please try again later.", 503);
          }
        }
        // Modify PMS to accept bookingId for potential linking, though its primary role is schedule management
        await bookingDetails.pmsInstance.updateAvailabilityForBooking(
          spot._id,
          newBookingDocument._id, // Pass bookingId
          requestedStartTime,
          requestedEndTime,
          { session: sess }, // Pass session for transaction
        );
      }
    }); // End of transaction

    return newBookingDocument;
  } catch (error) {
    console.error('Error in bookingService.createBooking:', error);
    // Do not re-throw AppError if it's already an AppError
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to create booking: ${error.message}`, 500);
  } finally {
    if (session.inTransaction()) {
        await session.abortTransaction(); // Ensure transaction is cleaned up on unexpected errors
    }
    session.endSession();
  }
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