const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const ParkingSpot = require("../models/parkingSpotModel");
const AppError = require("../utils/appError");
const parkingSpotService = require("./parkingSpotService");

/**
 * Create a new booking
 * @param {Object} bookingData - Data for the new booking
 * @returns {Promise<Object>} The created booking
 */

/**
 * Create a new booking
 * @param {string} userId - User ID
 * @param {string} spotId - Parking spot ID
 * @param {Date} requestedStartTime - Start time for booking
 * @param {Date} requestedEndTime - End time for booking
 * @param {Object} bookingDetails - Additional booking details
 * @returns {Promise<Object>} The created booking
 */
exports.createBooking = async (
  userId,
  spotId,
  requestedStartTime,
  requestedEndTime,
  bookingDetails = {}
) => {
  const session = await mongoose.startSession();
  let newBookingDocument = null;

  try {
    await session.withTransaction(async (sess) => {
      // 1. Find the spot
      const spot = await ParkingSpot.findById(spotId).session(sess);
      if (!spot) {
        throw new AppError("Parking spot not found.", 404);
      }

      // 2. Find matching availability schedule
      const matchingSchedule = spot.availability_schedule?.find(
        (slot) =>
          slot.is_available &&
          requestedStartTime >= slot.start_datetime &&
          requestedEndTime <= slot.end_datetime
      );

      if (!matchingSchedule) {
        throw new AppError(
          "No available schedule found for the requested time",
          400
        );
      }
      // 3. Determine booking details based on spot type
      let booking_source;
      let final_base_rate;
      let initial_payment_status = "pending";

      if (spot.spot_type === "private") {
        booking_source = "private_spot_rental";
        final_base_rate =
          bookingDetails.base_rate_override !== undefined
            ? bookingDetails.base_rate_override
            : spot.hourly_price;
      } else if (spot.spot_type === "building") {
        booking_source = "resident_building_allocation";
        final_base_rate = 0;
        initial_payment_status = "not_applicable";
      } else {
        throw new AppError(
          `Booking not supported for spot type: ${spot.spot_type}`,
          400
        );
      }

      // 4. Create booking payload
      const bookingPayload = {
        user: userId,
        spot: spotId,
        schedule: matchingSchedule._id,
        start_datetime: requestedStartTime,
        end_datetime: requestedEndTime,
        booking_type: bookingDetails.booking_type || "parking",
        base_rate: final_base_rate,
        status: "active",
        payment_status: initial_payment_status,
        booking_source,
      };

      // 5. Create the booking
      const createdBookings = await Booking.create([bookingPayload], {
        session: sess,
      });
      newBookingDocument = createdBookings[0];

      // 6. Mark the schedule as booked but keep it
      await parkingSpotService.markScheduleAsBooked(
        spotId,
        matchingSchedule._id.toString(),
        newBookingDocument._id,
        { session: sess }
      );

      // 7. Create partial availability windows if needed
      if (matchingSchedule.start_datetime < requestedStartTime) {
        // Create "before booking" window
        await ParkingSpot.findByIdAndUpdate(
          spotId,
          {
            $push: {
              availability_schedule: {
                start_datetime: matchingSchedule.start_datetime,
                end_datetime: requestedStartTime,
                is_available: true,
                type: matchingSchedule.type,
              },
            },
          },
          { session: sess }
        );
      }

      if (matchingSchedule.end_datetime > requestedEndTime) {
        // Create "after booking" window
        await ParkingSpot.findByIdAndUpdate(
          spotId,
          {
            $push: {
              availability_schedule: {
                start_datetime: requestedEndTime,
                end_datetime: matchingSchedule.end_datetime,
                is_available: true,
                type: matchingSchedule.type,
              },
            },
          },
          { session: sess }
        );
      }
    });

    return newBookingDocument;
  } catch (error) {
    console.error("Error in bookingService.createBooking:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to create booking: ${error.message}`, 500);
  } finally {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
  }
};
/**
 * Cancel a booking and restore availability
 */
exports.cancelBooking = async (bookingId, userId) => {
  const session = await mongoose.startSession();
  
  try {
    let canceledBooking = null;
    
    await session.withTransaction(async (sess) => {
      // 1. Find the booking
      const booking = await Booking.findById(bookingId).session(sess);
      if (!booking) {
        throw new AppError("Booking not found", 404);
      }
      
      // 2. Verify ownership
      if (booking.user.toString() !== userId) {
        throw new AppError("You don't have permission to cancel this booking", 403);
      }
      
      // 3. Check if it's not too late to cancel
      if (booking.status === "cancelled") {
        throw new AppError("Booking is already cancelled", 400);
      }
      
      const now = new Date();
      if (booking.start_datetime <= now) {
        throw new AppError("Cannot cancel a booking that has already started", 400);
      }
      
      // 4. Get the schedule ID and spot ID
      const scheduleId = booking.schedule;
      const spotId = booking.spot;
      
      if (!scheduleId) {
        throw new AppError("This booking doesn't have an associated schedule", 400);
      }
      
      // 5. Update the booking status
      booking.status = "cancelled";
      await booking.save({ session: sess });
      
      // 6. Restore the original availability window
      await parkingSpotService.restoreSchedule(
        spotId, 
        scheduleId.toString(),
        { session: sess }
      );
      
      // 7. Remove any partial windows that were created
      await ParkingSpot.updateOne(
        { _id: spotId },
        {
          $pull: {
            availability_schedule: {
              $or: [
                { end_datetime: booking.start_datetime, is_available: true },
                { start_datetime: booking.end_datetime, is_available: true }
              ]
            }
          }
        },
        { session: sess }
      );
      
      // 8. Optimize remaining schedules to ensure proper merging
      await parkingSpotService.optimizeAvailabilitySchedules(spotId, { session: sess });
      
      canceledBooking = booking;
    });
    
    return canceledBooking;
  } catch (error) {
    console.error("Error in bookingService.cancelBooking:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to cancel booking: ${error.message}`, 500);
  } finally {
    if (session.inTransaction()) {
      await session.abortTransaction();
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
exports.checkParkingSpotAvailability = async (spotId, startTime, endTime) => {
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
        end_datetime: { $gte: endTime },
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
