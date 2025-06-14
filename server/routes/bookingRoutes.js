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

// Move user-specific routes before the generic ID route to avoid conflicts
router.get("/user/my-bookings", bookingController.getUserBookings);

// New routes for payment system
router.get(
  "/user/unpaid-completed",
  bookingController.getUnpaidCompletedBookings
);

router.post("/:bookingId/confirm-payment", bookingController.confirmPayment);

// Get booking for specific schedule
router.get(
  "/spot/:spotId/schedule/:scheduleId",
  bookingController.getBookingForSchedule
);

// Generic ID routes - should be last to avoid conflicts
router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.cancelBooking);

module.exports = router;