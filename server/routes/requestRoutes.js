const express = require("express");
const requestController = require("./../controllers/requestController");
const authController = require("./../controllers/authController");
const router = express.Router();

// Protect all routes except for getting all requests and a single request
router
  .route("/")
  .get(requestController.getAllRequests)
  .post(authController.protect, requestController.createRequest);

// Specialized routes for request operations
router
  .route("/pending")
  .get(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    requestController.getPendingRequests
  );

router
  .route("/:id/approve")
  .patch(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    requestController.approveRequest
  );

router
  .route("/:id/reject")
  .patch(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    requestController.rejectRequest
  );

// Standard CRUD routes
router
  .route("/:id")
  .get(requestController.getRequest)
  .patch(authController.protect, requestController.updateRequest)
  .delete(authController.protect, requestController.deleteRequest);

module.exports = router;
