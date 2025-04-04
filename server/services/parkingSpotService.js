const ParkingSpot = require("../models/parkingSpotModel");
const Building = require("../models/buildingModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");

/**
 * Service layer for parking spot-related operations
 */
class ParkingSpotService {
  /**
   * Create a new parking spot
   * @param {Object} parkingSpotData - Data for the new parking spot
   * @returns {Promise<Object>} The created parking spot
   */
  async createParkingSpot(parkingSpotData) {
    // Validate based on spot_type
    if (parkingSpotData.spot_type === "building") {
      // Check if the building exists
      const building = await Building.findById(parkingSpotData.building);
      if (!building) {
        throw new AppError("Building not found", 404);
      }

      // Check for duplicate spot in the building
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
      // Ensure hourly price exists if it's a private spot available for rent
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

      // Ensure charger type if it's a charging station
      if (
        parkingSpotData.is_charging_station &&
        !parkingSpotData.charger_type
      ) {
        throw new AppError(
          "Charging stations must specify their charger type",
          400
        );
      }
    } else {
      throw new AppError("Invalid parking spot type", 400);
    }

    // Create the parking spot
    return await ParkingSpot.create(parkingSpotData);
  }

  /**
   * Get a parking spot by ID
   * @param {string} id - Parking spot ID
   * @returns {Promise<Object>} The parking spot data
   */
  async getParkingSpotById(id) {
    const parkingSpot = await ParkingSpot.findById(id);
    if (!parkingSpot) {
      throw new AppError("Parking spot not found", 404);
    }
    return parkingSpot;
  }

  /**
   * Get all parking spots, with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} List of parking spots
   */
  async getAllParkingSpots(filters = {}) {
    const query = ParkingSpot.find(filters);
    return await query;
  }

  /**
   * Get all parking spots in a specific building
   * @param {string} buildingId - Building ID
   * @returns {Promise<Array>} List of parking spots in the building
   */
  async getParkingSpotsByBuilding(buildingId) {
    // Check if the building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      throw new AppError("Building not found", 404);
    }

    return await ParkingSpot.find({
      building: buildingId,
      spot_type: "building",
    }).populate("user");
  }

  /**
   * Update a parking spot
   * @param {string} id - Parking spot ID
   * @param {Object} updateData - New parking spot data
   * @param {string} userId - ID of user making the update
   * @param {string} userRole - Role of user making the update
   * @returns {Promise<Object>} The updated parking spot
   */
  async updateParkingSpot(id, updateData, userId, userRole) {
    const parkingSpot = await ParkingSpot.findById(id);

    if (!parkingSpot) {
      throw new AppError("No parking spot found with that ID", 404);
    }

    // Check ownership or admin rights
    if (
      parkingSpot.owner.toString() !== userId &&
      !["admin", "building_manager"].includes(userRole)
    ) {
      throw new AppError(
        "You do not have permission to update this parking spot",
        403
      );
    }

    // Prevent changing the spot_type
    if (
      updateData.spot_type &&
      updateData.spot_type !== parkingSpot.spot_type
    ) {
      throw new AppError("Cannot change the type of a parking spot", 400);
    }

    // Validate updates based on spot type
    if (parkingSpot.spot_type === "building") {
      if (updateData.hourly_price) {
        throw new AppError(
          "Cannot set hourly price for building parking spots",
          400
        );
      }
    }

    // Additional validation for charging stations
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

    // Update the document
    return await ParkingSpot.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete a parking spot
   * @param {string} id - Parking spot ID
   * @param {string} userId - ID of user making the deletion
   * @param {string} userRole - Role of user making the deletion
   * @returns {Promise<void>}
   */
  async deleteParkingSpot(id, userId, userRole) {
    const parkingSpot = await ParkingSpot.findById(id);

    if (!parkingSpot) {
      throw new AppError("No parking spot found with that ID", 404);
    }

    // Check ownership or admin rights
    if (
      parkingSpot.owner.toString() !== userId &&
      !["admin", "building_manager"].includes(userRole)
    ) {
      throw new AppError(
        "You do not have permission to delete this parking spot",
        403
      );
    }

    // Check if the spot is occupied
    if (parkingSpot.user) {
      throw new AppError(
        "Cannot delete a parking spot that is currently in use",
        400
      );
    }

    // Check if there are any future bookings for this spot
    const futureBookings = await Booking.find({
      parkingSpot: id,
      endTime: { $gt: new Date() },
    });

    if (futureBookings.length > 0) {
      throw new AppError(
        "Cannot delete parking spot with active bookings",
        400
      );
    }

    await ParkingSpot.findByIdAndDelete(id);
  }

  /**
   * Assign a user to a parking spot
   * @param {string} spotId - Parking spot ID
   * @param {string} userId - User ID to assign
   * @returns {Promise<Object>} The updated parking spot
   */
  async assignUser(spotId, userId) {
    // Check if the parking spot exists
    const parkingSpot = await ParkingSpot.findById(spotId);
    if (!parkingSpot) {
      throw new AppError("Parking spot not found", 404);
    }

    // Check if the parking spot is already occupied
    if (parkingSpot.user) {
      throw new AppError("This parking spot is already occupied", 400);
    }

    // Check if the parking spot is available
    if (!parkingSpot.is_available) {
      throw new AppError("This parking spot is not available", 400);
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // For building spots, ensure the user is associated with the building
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

    // Update the parking spot
    parkingSpot.user = userId;
    await parkingSpot.save();

    // Update the user's parking spot reference
    user.parking_spot = parkingSpot._id;
    await user.save({ validateBeforeSave: false });

    return parkingSpot;
  }

  /**
   * Unassign a user from a parking spot
   * @param {string} spotId - Parking spot ID
   * @returns {Promise<Object>} The updated parking spot
   */
  async unassignUser(spotId) {
    // Check if the parking spot exists
    const parkingSpot = await ParkingSpot.findById(spotId);
    if (!parkingSpot) {
      throw new AppError("Parking spot not found", 404);
    }

    // Check if the parking spot is already unassigned
    if (!parkingSpot.user) {
      throw new AppError("This parking spot is already unassigned", 400);
    }

    // Get the user who has this parking spot
    const user = await User.findById(parkingSpot.user);
    if (user) {
      user.parking_spot = undefined;
      await user.save({ validateBeforeSave: false });
    }

    // Update the parking spot
    parkingSpot.user = undefined;
    await parkingSpot.save();

    return parkingSpot;
  }

  /**
   * Toggle the availability of a parking spot
   * @param {string} spotId - Parking spot ID
   * @param {boolean} isAvailable - New availability status
   * @param {string} userId - ID of user making the change
   * @param {string} userRole - Role of user making the change
   * @returns {Promise<Object>} The updated parking spot
   */
  async toggleAvailability(spotId, isAvailable, userId, userRole) {
    // Check if the parking spot exists
    const parkingSpot = await ParkingSpot.findById(spotId);
    if (!parkingSpot) {
      throw new AppError("Parking spot not found", 404);
    }

    // Check ownership or admin rights
    if (
      parkingSpot.owner.toString() !== userId &&
      !["admin", "building_manager"].includes(userRole)
    ) {
      throw new AppError(
        "You do not have permission to update this parking spot",
        403
      );
    }

    // Cannot change availability if the spot is currently occupied
    if (parkingSpot.user && isAvailable === false) {
      throw new AppError(
        "Cannot change availability of an occupied parking spot",
        400
      );
    }

    // Update availability
    parkingSpot.is_available = isAvailable;
    await parkingSpot.save();

    return parkingSpot;
  }

  /**
   * Get all available private parking spots
   * @returns {Promise<Array>} List of available private spots
   */
  async getAvailablePrivateSpots() {
    return await ParkingSpot.find({
      spot_type: "private",
      is_available: true,
      user: { $exists: false },
    }).populate("owner");
  }

  /**
   * Get all parking spots owned by a specific user
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Array>} List of parking spots owned by the user
   */
  async getOwnerParkingSpots(ownerId) {
    return await ParkingSpot.find({
      owner: ownerId,
    }).populate("user building");
  }

  /**
   * Get all available charging stations
   * @returns {Promise<Array>} List of available charging stations
   */
  async getChargingStations() {
    return await ParkingSpot.find({
      is_charging_station: true,
      is_available: true,
    }).populate("owner");
  }

  /**
   * Get available parking spots for a specific time period
   * @param {Date} startTime - Start of the period
   * @param {Date} endTime - End of the period
   * @param {Object} filters - Additional filters (e.g., building, features)
   * @returns {Promise<Array>} List of available parking spots
   */
  async getAvailableParkingSpots(startTime, endTime, filters = {}) {
    // Get all parking spots matching the filters
    const allSpots = await this.getAllParkingSpots(filters);

    // Get IDs of spots with bookings during the requested period
    const bookedSpotIds = await Booking.distinct("parkingSpot", {
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
      status: { $ne: "canceled" },
    });

    // Filter out booked spots
    const availableSpots = allSpots.filter(
      (spot) =>
        !bookedSpotIds.some((id) => id.toString() === spot._id.toString())
    );

    return availableSpots;
  }
}

module.exports = new ParkingSpotService();
