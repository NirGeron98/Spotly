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
/**
 * Creates a new booking, updating the parking spot's availability schedule.
 *
 * @param {string} userId - The ID of the user making the booking.
 * @param {string} spotId - The ID of the parking spot.
 * @param {Date} requestedStartTimeUTC - The requested start datetime in UTC.
 * @param {Date} requestedEndTimeUTC - The requested end datetime in UTC.
 * @param {Object} bookingDetails - Additional details like booking_type, base_rate_override.
 * @param {string} timezone - The timezone of the user making the booking (for record-keeping).
 * @returns {Promise<Booking>} The newly created booking document.
 */
exports.createBooking = async (
  userId,
  spotId,
  requestedStartTimeUTC,
  requestedEndTimeUTC,
  bookingDetails = {},
  timezone,
  options = {}
) => {
  const isNewSession = !options.session;
  const session = isNewSession
    ? await mongoose.startSession()
    : options.session;
  let newBookingDocument = null;

  try {
    if (isNewSession) {
      session.startTransaction();
    }
    // 1. Fetch the parking spot within the transaction
    const spot = await ParkingSpot.findById(spotId).session(session);
    if (!spot) {
      throw new AppError("Parking spot not found.", 404);
    }

    // 2. Find an available schedule slot that entirely contains the requested booking time
    // The `availability_schedule` should be sorted by start_datetime for predictable matching.
    // This can be enforced by sorting before saving or when querying if not always sorted.
    const suitableSchedule = spot.availability_schedule
      .sort((a, b) => a.start_datetime - b.start_datetime) // Ensure order
      .find(
        (slot) =>
          slot.is_available &&
          requestedStartTimeUTC >= slot.start_datetime &&
          requestedEndTimeUTC <= slot.end_datetime
      );

    if (!suitableSchedule) {
      throw new AppError(
        "No available schedule window found for the requested time.",
        400
      );
    }

    // 3. Determine booking source, base rate, and payment status
    let booking_source;
    let final_base_rate;
    let initial_payment_status = "pending"; // Default for private spots

    if (spot.spot_type === "private") {
      booking_source = "private_spot_rental";
      final_base_rate =
        bookingDetails.base_rate_override !== undefined
          ? bookingDetails.base_rate_override
          : spot.hourly_price; // Assuming hourly_price exists on private spots
      if (final_base_rate === undefined || final_base_rate === null) {
        throw new AppError("Hourly rate not set for this private spot.", 400);
      }
    } else if (spot.spot_type === "building") {
      booking_source = "resident_building_allocation";
      final_base_rate = 0; // Typically free or managed differently for residents
      initial_payment_status = "not_applicable";
    } else {
      throw new AppError(
        `Booking not supported for spot type: ${spot.spot_type}`,
        400
      );
    }

    // 4. Create the booking document
    const bookingPayload = {
      user: userId,
      spot: spotId,
      schedule: suitableSchedule._id, // Link to the original schedule entry that is being booked/split
      start_datetime: requestedStartTimeUTC,
      end_datetime: requestedEndTimeUTC,
      status: "active", // Or "pending_confirmation" if you have such a flow
      booking_type:
        bookingDetails.booking_type ||
        (spot.is_charging_station ? "charging" : "parking"),
      booking_source,
      base_rate: final_base_rate,
      // final_amount might be calculated later based on duration and rate
      payment_status: initial_payment_status,
      timezone: timezone || "UTC", // Store user's timezone
    };

    const createdBookings = await Booking.create([bookingPayload], { session });
    newBookingDocument = createdBookings[0];

    // 5. Mark the original schedule as booked and split it to create surrounding available windows
    // The original `suitableSchedule` entry will now represent the booked portion.
    // New entries will be made for any time before or after the booking within that original slot.
    await parkingSpotService.markScheduleAsBookedAndSplit(
      spotId,
      suitableSchedule._id.toString(),
      requestedStartTimeUTC,
      requestedEndTimeUTC,
      newBookingDocument._id,
      { session }
    );

    // 6. (Optional but Recommended) Optimize schedules to merge any new fragments if possible
    // Though splitting logic should create distinct new fragments, a general cleanup is good.
    // However, splitting logic is quite specific, direct optimization might not be needed here if splitting is precise.
    // If splitting creates fragments that could immediately merge with *other existing* fragments, then run:
    // await parkingSpotService.optimizeAvailabilitySchedules(spotId, { session });

    if (isNewSession) {
      await session.commitTransaction();
    }
    return newBookingDocument;
  } catch (error) {
    if (isNewSession) {
      await session.abortTransaction();
    }
    console.error("Error in createBooking service:", error);
    if (error instanceof AppError) throw error; // Re-throw AppError instances
    throw new AppError(`Failed to create booking: ${error.message}`, 500); // Wrap other errors
  } finally {
    if (isNewSession) {
      session.endSession();
    }
  }
};
/**
 * Cancels a booking and restores the availability of the parking spot schedule.
 *
 * @param {string} bookingId - The ID of the booking to cancel.
 * @param {string} userId - The ID of the user attempting to cancel (for permission check).
 * @returns {Promise<Booking>} The updated (canceled) booking document.
 */
exports.cancelBooking = async (bookingId, userId, options = {}) => {
  const session = options.session || await mongoose.startSession();
  const isNewSession = !options.session;

  let canceledBookingDoc = null;
  try {
    if (isNewSession) {
      session.startTransaction();
    }
    // 1. Find the booking and populate spot details to get schedule info
    const booking = await Booking.findById(bookingId)
      .populate('spot')
      .session(session);

    if (!booking) {
      throw new AppError("Booking not found.", 404);
    }

    // 2. Authorization: Check if the user owns the booking or has rights to cancel
    if (booking.user.toString() !== userId) {
      throw new AppError(
        "You do not have permission to cancel this booking.",
        403
      );
    }

    // 3. Check booking status
    if (booking.status === "canceled") {
      throw new AppError("Booking is already canceled.", 400);
    }
    if (booking.status === "completed") {
      throw new AppError("Cannot cancel a completed booking.", 400);
    }

    const now = new Date();
    const isActiveBooking = booking.start_datetime <= now && now < booking.end_datetime;

    // 4. Handle the availability restoration based on cancellation timing
    if (!booking.schedule) {
      // Create new availability for the remaining time slot
      const spot = await ParkingSpot.findById(booking.spot._id).session(session);
      if (!spot) {
        throw new AppError("Associated parking spot not found.", 404);
      }

      // If canceling during active use, create availability from now until end time
      const availabilityStartTime = isActiveBooking ? now : booking.start_datetime;
      
      spot.availability_schedule.push({
        _id: new mongoose.Types.ObjectId(),
        start_datetime: availabilityStartTime,
        end_datetime: booking.end_datetime,
        is_available: true,
        type: booking.booking_type === "charging" ? "טעינה לרכב חשמלי" : "השכרה רגילה",
        booking_id: null,
      });

      await spot.save({ session });
    } else {
      // This is the primary path: the booking has a schedule ID
      await parkingSpotService.restoreSchedule(
        booking.spot._id.toString(),
        booking.schedule.toString(),
        { 
          session,
          currentTime: isActiveBooking ? now : null // Pass current time if canceling mid-use
        }
      );
    }

    // 5. Optimize the availability schedule
    await parkingSpotService.optimizeAvailabilitySchedules(
      booking.spot._id.toString(),
      { session }
    );    // 6. Update the booking status, end time, and handle payment recalculation for private spots
    booking.status = "canceled";
    if (isActiveBooking) {
      booking.actual_end_datetime = now;

      // Handle payment recalculation only for private spots
      if (booking.booking_source === "private_spot_rental") {
        // Calculate actual usage duration in hours
        const actualUsageHours = (now - booking.start_datetime) / (1000 * 60 * 60);
        const originalHours = (booking.end_datetime - booking.start_datetime) / (1000 * 60 * 60);
        
        // Recalculate the final amount based on actual usage
        const hourlyRate = booking.final_amount / originalHours;
        const newAmount = hourlyRate * actualUsageHours;
        
        // Update the booking with new amount
        booking.final_amount = Math.round(newAmount * 100) / 100; // Round to 2 decimal places
        
        // If they already paid, calculate refund amount
        if (booking.payment_status === "completed") {
          const refundAmount = Math.round((booking.original_amount - newAmount) * 100) / 100;
          booking.refund_amount = refundAmount > 0 ? refundAmount : 0;
          booking.payment_status = "pending_refund";
        }

      }
    }
    
    canceledBookingDoc = await booking.save({ session });

    if (isNewSession) {
      await session.commitTransaction();
    }

    return canceledBookingDoc;
  } catch (error) {
    if (isNewSession) {
      await session.abortTransaction();
    }
    console.error("Error in cancelBooking service:", error);
    throw error;
  } finally {
    if (isNewSession) {
      session.endSession();
    }
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
