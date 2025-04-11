const express = require("express");
const requestController = require("./../controllers/requestController");
const authController = require("./../controllers/authController");
const router = express.Router();

// Middleware to protect all routes after this point
router.use(authController.protect);

router
  .route("/")
  .get(requestController.getAllRequests)
  .post(requestController.createRequest);

router
  .route("/:id")
  .get(requestController.getRequest)
  .patch(requestController.updateRequest)
  .delete(requestController.deleteRequest);

// Specialized routes for request operations
router
  .route("/pending")
  .get(
    authController.restrictTo("admin", "building_manager"),
    requestController.getPendingRequests
  );

router
  .route("/:id/approve")
  .patch(
    authController.restrictTo("admin", "building_manager"),
    requestController.approveRequest
  );

router
  .route("/:id/reject")
  .patch(
    authController.restrictTo("admin", "building_manager"),
    requestController.rejectRequest
  );

module.exports = router;
