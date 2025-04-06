const Request = require("./../models/userModel");
const factory = require("../controllers/handlerFactory");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel");
const Building = require("./../models/buildingModel");

// Service functions using factory methods (for compatibility with existing code)
const getAllRequests = factory.getAll(Request);
const createRequest = factory.createOne(Request);
const getRequest = factory.getOne(Request, {
  path: "assigned_spot building user",
});
const updateRequest = factory.updateOne(Request);
const deleteRequest = factory.deleteOne(Request);

/**
 * Get requests by status
 * @param {string} status - Request status (pending, approved, rejected, etc.)
 * @returns {Promise<Array>} - List of requests with the specified status
 */
const getRequestsByStatus = async (status) => {
  const requests = await Request.find({ status })
    .populate("assigned_spot")
    .populate("building")
    .populate({
      path: "user",
      select: "first_name last_name email",
    });

  return requests;
};

/**
 * Update request status with optional rejection reason
 * @param {string} id - Request ID
 * @param {string} status - New status (approved, rejected, etc.)
 * @param {string} updatedBy - User ID making the update
 * @param {string} [reason] - Optional reason for rejection
 * @returns {Promise<Object>} - Updated request
 */
const updateRequestStatus = async (id, status, updatedBy, reason = null) => {
  // Find the request
  const request = await Request.findById(id);

  if (!request) {
    throw new AppError("No request found with that ID", 404);
  }

  // Check if request is already in the target status
  if (request.status === status) {
    throw new AppError(`Request is already ${status}`, 400);
  }

  // Validate the status transition
  const validTransitions = {
    pending: ["approved", "rejected"],
    approved: ["completed", "canceled"],
    rejected: ["pending"], // Allow resubmission
  };

  const currentStatus = request.status || "pending";

  if (
    !validTransitions[currentStatus] ||
    !validTransitions[currentStatus].includes(status)
  ) {
    throw new AppError(
      `Cannot change request status from ${currentStatus} to ${status}`,
      400
    );
  }

  // Update the request
  const updateData = {
    status,
    updated_by: updatedBy,
    updated_at: Date.now(),
  };

  // Add reason if provided (for rejections)
  if (status === "rejected" && reason) {
    updateData.rejection_reason = reason;
  }

  // Perform special processing for approved requests
  if (status === "approved") {
    // For example, update related entities, send notifications, etc.
    // This would depend on your specific requirements
  }

  const updatedRequest = await Request.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("assigned_spot")
    .populate("building")
    .populate({
      path: "user",
      select: "first_name last_name email",
    });

  return updatedRequest;
};

/**
 * Get requests for a specific building
 * @param {string} buildingId - Building ID
 * @returns {Promise<Array>} - List of requests for the building
 */
const getRequestsByBuilding = async (buildingId) => {
  // Check if building exists
  const building = await Building.findById(buildingId);
  if (!building) {
    throw new AppError("No building found with that ID", 404);
  }

  const requests = await Request.find({ building: buildingId })
    .populate("assigned_spot")
    .populate("building")
    .populate({
      path: "user",
      select: "first_name last_name email",
    });

  return requests;
};

/**
 * Get requests created by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of user's requests
 */
const getUserRequests = async (userId) => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("No user found with that ID", 404);
  }

  const requests = await Request.find({ user: userId })
    .populate("assigned_spot")
    .populate("building")
    .populate({
      path: "user",
      select: "first_name last_name email",
    });

  return requests;
};

module.exports = {
  getAllRequests,
  createRequest,
  getRequest,
  updateRequest,
  deleteRequest,
  getRequestsByStatus,
  updateRequestStatus,
  getRequestsByBuilding,
  getUserRequests,
};
