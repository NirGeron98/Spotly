const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Standard CRUD routes
router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)

// Specialized routes
router.get("/user/my-bookings", bookingController.getUserBookings);
router.get("/availability", bookingController.checkAvailability);

module.exports = router;
