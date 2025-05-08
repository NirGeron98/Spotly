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
        timezone: bookingDetails.timezone || "UTC",
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
  console.log(`Starting cancelBooking for booking ${bookingId}`);

  try {
    let canceledBooking = null;

    await session.withTransaction(async (sess) => {
      // 1. Find the booking with populated spot details
      console.log("Finding booking...");
      const booking = await Booking.findById(bookingId)
        .populate("spot") // Make sure to populate spot
        .session(sess);

      if (!booking) {
        console.log("Booking not found!");
        throw new AppError("Booking not found", 404);
      }

      console.log(
        `Found booking: ${booking._id}, schedule: ${booking.schedule}, spot: ${booking.spot._id}`
      );

      // 2. Get important references
      const scheduleId = booking.schedule;
      const spotId = booking.spot._id;
      const bookingStart = booking.start_datetime;
      const bookingEnd = booking.end_datetime;
      const spotType = booking.spot.spot_type;
      const bookingType = booking.booking_type;

      // 3. Verify ownership & check cancellation conditions
      if (booking.user.toString() !== userId) {
        throw new AppError(
          "You don't have permission to cancel this booking",
          403
        );
      }

      if (booking.status === "canceled") {
        throw new AppError("Booking is already cancelled", 400);
      }

      const now = new Date();
      if (booking.start_datetime <= now) {
        throw new AppError(
          "Cannot cancel a booking that has already started",
          400
        );
      }

      // 4. Try to restore schedule, or create a new one if not found
      try {
        if (scheduleId) {
          console.log(`Restoring schedule ${scheduleId} for spot ${spotId}`);
          await parkingSpotService.restoreSchedule(
            spotId,
            scheduleId.toString(),
            { session: sess }
          );
          console.log("Successfully restored schedule");
          console.log("Cleaning up partial windows");
          await ParkingSpot.findByIdAndUpdate(
            spotId,
            {
              $pull: {
                availability_schedule: {
                  $and: [
                    { _id: { $ne: mongoose.Types.ObjectId(scheduleId) } }, // Don't remove the schedule we just restored
                    {
                      $or: [
                        // Remove windows that start at the same time as the booking but end earlier
                        {
                          start_datetime: booking.start_datetime,
                          end_datetime: { $lt: booking.end_datetime },
                        },
                        // Remove windows that end at the same time as the booking but start later
                        {
                          end_datetime: booking.end_datetime,
                          start_datetime: { $gt: booking.start_datetime },
                        },
                        // Remove any window that falls entirely within the booking's timeframe
                        {
                          start_datetime: { $gte: booking.start_datetime },
                          end_datetime: { $lte: booking.end_datetime },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            { session: sess }
          );
        } else {
          throw new Error("No schedule ID found");
        }
      } catch (scheduleError) {
        console.log(
          "Creating new availability window due to error:",
          scheduleError.message
        );

        // Create new availability window with the booked time range
        await ParkingSpot.findByIdAndUpdate(
          spotId,
          {
            $push: {
              availability_schedule: {
                start_datetime: bookingStart,
                end_datetime: bookingEnd,
                is_available: true,
                type:
                  bookingType === "charging"
                    ? "טעינה לרכב חשמלי"
                    : "השכרה רגילה",
              },
            },
          },
          { session: sess }
        );

        // After creating a new window, optimize to merge with any adjacent ones
        await parkingSpotService.optimizeAvailabilitySchedules(spotId, {
          session: sess,
        });
      }

      // 5. Update booking status
      booking.status = "canceled";
      await booking.save({ session: sess });

      canceledBooking = booking;
    });

    return canceledBooking;
  } catch (error) {
    console.error("Error in bookingService.cancelBooking:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to cancel booking: ${error.message}`, 500);
  } finally {
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
