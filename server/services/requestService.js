const Request = require("../models/requestModel");
const User = require("../models/userModel");
const ParkingSpot = require("../models/parkingSpotModel");
const Building = require("../models/buildingModel");
const AppError = require("../utils/appError");

/**
 * Service layer for request-related operations
 */
class RequestService {
  /**
   * Create a new request
   * @param {Object} requestData - Data for the new request
   * @returns {Promise<Object>} The created request
   */
  async createRequest(requestData) {
    // Validate if the user exists
    if (requestData.user) {
      const user = await User.findById(requestData.user);
      if (!user) {
        throw new AppError("User not found", 404);
      }
    }

    // Validate if the building exists
    if (requestData.building) {
      const building = await Building.findById(requestData.building);
      if (!building) {
        throw new AppError("Building not found", 404);
      }
    }

    // Validate if the parking spot exists
    if (requestData.assigned_spot) {
      const parkingSpot = await ParkingSpot.findById(requestData.assigned_spot);
      if (!parkingSpot) {
        throw new AppError("Parking spot not found", 404);
      }
    }

    // Create the request
    return await Request.create(requestData);
  }

  /**
   * Get a request by ID
   * @param {string} id - Request ID
   * @returns {Promise<Object>} The request data
   */
  async getRequestById(id) {
    const request = await Request.findById(id)
      .populate("user")
      .populate("building")
      .populate("assigned_spot");

    if (!request) {
      throw new AppError("Request not found", 404);
    }

    return request;
  }

  /**
   * Get all requests, with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} List of requests
   */
  async getAllRequests(filters = {}) {
    return await Request.find(filters)
      .populate("user")
      .populate("building")
      .populate("assigned_spot");
  }

  /**
   * Update a request
   * @param {string} id - Request ID
   * @param {Object} updateData - New request data
   * @returns {Promise<Object>} The updated request
   */
  async updateRequest(id, updateData) {
    const request = await Request.findById(id);

    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Validate if the updated user exists
    if (updateData.user) {
      const user = await User.findById(updateData.user);
      if (!user) {
        throw new AppError("User not found", 404);
      }
    }

    // Validate if the updated building exists
    if (updateData.building) {
      const building = await Building.findById(updateData.building);
      if (!building) {
        throw new AppError("Building not found", 404);
      }
    }

    // Validate if the updated parking spot exists
    if (updateData.assigned_spot) {
      const parkingSpot = await ParkingSpot.findById(updateData.assigned_spot);
      if (!parkingSpot) {
        throw new AppError("Parking spot not found", 404);
      }
    }

    // Update the request
    return await Request.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("user building assigned_spot");
  }

  /**
   * Delete a request
   * @param {string} id - Request ID
   * @returns {Promise<void>}
   */
  async deleteRequest(id) {
    const request = await Request.findById(id);

    if (!request) {
      throw new AppError("Request not found", 404);
    }

    await Request.findByIdAndDelete(id);
  }

  /**
   * Approve a request
   * @param {string} id - Request ID
   * @returns {Promise<Object>} The approved request
   */
  async approveRequest(id) {
    const request = await Request.findById(id);

    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // If this is a parking spot request and a spot is assigned
    if (request.type === "parking_spot" && request.assigned_spot) {
      // Assign the user to the parking spot
      const parkingSpot = await ParkingSpot.findById(request.assigned_spot);

      if (!parkingSpot) {
        throw new AppError("Assigned parking spot not found", 404);
      }

      // Check if the spot is already occupied
      if (parkingSpot.user) {
        throw new AppError("This parking spot is already occupied", 400);
      }

      // Update the spot with the user
      parkingSpot.user = request.user;
      await parkingSpot.save();

      // Update the user's parking spot
      const user = await User.findById(request.user);
      if (user) {
        user.parking_spot = request.assigned_spot;
        await user.save({ validateBeforeSave: false });
      }
    }

    // Update request status
    request.status = "approved";
    request.processed_at = Date.now();
    await request.save();

    return request;
  }

  /**
   * Reject a request
   * @param {string} id - Request ID
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<Object>} The rejected request
   */
  async rejectRequest(id, rejectionReason) {
    const request = await Request.findById(id);

    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Update request status
    request.status = "rejected";
    request.rejection_reason = rejectionReason;
    request.processed_at = Date.now();
    await request.save();

    return request;
  }

  /**
   * Get all pending requests
   * @returns {Promise<Array>} List of pending requests
   */
  async getPendingRequests() {
    return await Request.find({ status: "pending" })
      .populate("user")
      .populate("building")
      .populate("assigned_spot");
  }

  /**
   * Get all requests by a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of requests by the user
   */
  async getUserRequests(userId) {
    return await Request.find({ user: userId })
      .populate("building")
      .populate("assigned_spot");
  }
}

module.exports = new RequestService();
