const Booking = require("../models/bookingModel");
const ParkingSpot = require("../models/parkingSpotModel");
const AppError = require("../utils/appError");

/**
 * Service layer for booking-related operations
 */
class BookingService {
  /**
   * Create a new booking
   * @param {Object} bookingData - Data for the new booking
   * @returns {Promise<Object>} The created booking
   */
  async createBooking(bookingData) {
    // Check if the parking spot exists and is available for the requested time
    const parkingSpot = await ParkingSpot.findById(bookingData.parkingSpot);

    if (!parkingSpot) {
      throw new AppError("Parking spot not found", 404);
    }

    // Add additional validation logic here
    // For example, check if spot is already booked for the requested time period
    const isAvailable = await this.checkParkingSpotAvailability(
      bookingData.parkingSpot,
      bookingData.startTime,
      bookingData.endTime
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
  }

  /**
   * Get a booking by ID
   * @param {string} id - Booking ID
   * @returns {Promise<Object>} The booking data
   */
  async getBookingById(id) {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    return booking;
  }

  /**
   * Get all bookings for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of bookings
   */
  async getUserBookings(userId) {
    return await Booking.find({ user: userId });
  }

  /**
   * Check if a parking spot is available during a specific time period
   * @param {string} parkingSpotId - Parking spot ID
   * @param {Date} startTime - Start time of the period to check
   * @param {Date} endTime - End time of the period to check
   * @returns {Promise<boolean>} Whether the spot is available
   */
  async checkParkingSpotAvailability(parkingSpotId, startTime, endTime) {
    // Find any overlapping bookings
    const overlappingBookings = await Booking.find({
      parkingSpot: parkingSpotId,
      $or: [
        // Booking starts during the requested period
        { startTime: { $lt: endTime, $gte: startTime } },
        // Booking ends during the requested period
        { endTime: { $gt: startTime, $lte: endTime } },
        // Booking includes the entire requested period
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    });

    return overlappingBookings.length === 0;
  }

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID
   * @param {string} userId - ID of the user attempting to cancel
   * @returns {Promise<Object>} The canceled booking
   */
  async cancelBooking(bookingId, userId) {
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
    if (booking.startTime <= now) {
      throw new AppError(
        "Cannot cancel a booking that has already started",
        400
      );
    }

    booking.status = "canceled";
    await booking.save();

    return booking;
  }

  /**
   * Update a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} updateData - New booking data
   * @param {string} userId - ID of the user attempting to update
   * @returns {Promise<Object>} The updated booking
   */
  async updateBooking(bookingId, updateData, userId) {
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
    if (updateData.startTime || updateData.endTime) {
      const isAvailable = await this.checkParkingSpotAvailability(
        booking.parkingSpot,
        updateData.startTime || booking.startTime,
        updateData.endTime || booking.endTime
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
  }
}

module.exports = new BookingService();
