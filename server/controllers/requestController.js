const Request = require("./../models/requestModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const requestService = require("../services/requestService");

// Standard CRUD operations using factory pattern
exports.getAllRequests = factory.getAll(Request, {
  popOptions: [
    { path: "assigned_spot" },
    { path: "building" },
    { path: "user", select: "first_name last_name email" },
  ],
});

exports.getRequest = factory.getOne(Request, {
  popOptions: [
    { path: "assigned_spot" },
    { path: "building" },
    { path: "user", select: "first_name last_name email" },
  ],
});

exports.createRequest = factory.createOne(Request, {
  beforeCreate: async (req) => {
    // Set user ID from authenticated user if not provided
    if (!req.body.user) {
      req.body.user = req.user.id;
    }
  },
});

exports.updateRequest = factory.updateOne(Request);
exports.deleteRequest = factory.deleteOne(Request);

// Add any specialized request-specific controller methods here
// For example:

/**
 * Get all pending requests
 * @route GET /api/v1/requests/pending
 * @access Private (Admin, Building Manager)
 */
exports.getPendingRequests = catchAsync(async (req, res, next) => {
  const requests = await requestService.getRequestsByStatus("pending");

  res.status(200).json({
    status: "success",
    results: requests.length,
    data: {
      requests,
    },
  });
});

/**
 * Approve a request
 * @route PATCH /api/v1/requests/:id/approve
 * @access Private (Admin, Building Manager)
 */
exports.approveRequest = catchAsync(async (req, res, next) => {
  const request = await requestService.updateRequestStatus(
    req.params.id,
    "approved",
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: {
      request,
    },
  });
});

/**
 * Reject a request
 * @route PATCH /api/v1/requests/:id/reject
 * @access Private (Admin, Building Manager)
 */
exports.rejectRequest = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const request = await requestService.updateRequestStatus(
    req.params.id,
    "rejected",
    req.user.id,
    reason
  );

  res.status(200).json({
    status: "success",
    data: {
      request,
    },
  });
});
