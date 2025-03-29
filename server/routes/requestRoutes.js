const express = require("express");
const requestController = require("./../controllers/requestController");
const authController = require("./../controllers/authController");
const router = express.Router();

router
  .route("/")
  .get(requestController.getAllRequests)
  .post(requestController.createRequest);

router
  .route("/:id")
  .get(requestController.getRequest)
  .patch(authController.protect, requestController.updateRequest)
  .delete(authController.protect, requestController.deleteRequest);

module.exports = router;
