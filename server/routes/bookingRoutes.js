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

router.get(
  "/spot/:spotId/schedule/:scheduleId",
  bookingController.getBookingForSchedule
);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

// Get user's bookings
router.get("/user/my-bookings", bookingController.getUserBookings);

module.exports = router;