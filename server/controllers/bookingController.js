const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const bookingService = require("../services/bookingService");

// Standard CRUD operations using factory pattern
exports.getAllBookings = factory.getAll(Booking, {
  popOptions: [
    { path: "user", select: "first_name last_name email" },
    { path: "parkingSpot" },
  ],
  transform: (doc) => {
    // Customize response data if needed
    return doc;
  },
});

exports.getBooking = factory.getOne(Booking, {
  popOptions: [
    { path: "user", select: "first_name last_name email" },
    { path: "parkingSpot" },
  ],
});

// Using service for createBooking because it requires complex validation
exports.createBooking = catchAsync(async (req, res, next) => {
  // Set user ID from authenticated user if not provided
  if (!req.body.user) {
    req.body.user = req.user.id;
  }

  const booking = await bookingService.createBooking(req.body);

  res.status(201).json({
    status: "success",
    data: {
      booking,
    },
  });
});

// Using service for updateBooking with ownership validation
exports.updateBooking = catchAsync(async (req, res, next) => {
  const updatedBooking = await bookingService.updateBooking(
    req.params.id,
    req.body,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: {
      booking: updatedBooking,
    },
  });
});

// Use service for deleteBooking which is actually cancellation with validation
exports.deleteBooking = catchAsync(async (req, res, next) => {
  await bookingService.cancelBooking(req.params.id, req.user.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Additional domain-specific operations
exports.getUserBookings = catchAsync(async (req, res, next) => {
  const bookings = await bookingService.getUserBookings(req.user.id);

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.checkAvailability = catchAsync(async (req, res, next) => {
  const { parkingSpotId, startTime, endTime } = req.query;

  const isAvailable = await bookingService.checkParkingSpotAvailability(
    parkingSpotId,
    new Date(startTime),
    new Date(endTime)
  );

  res.status(200).json({
    status: "success",
    data: {
      isAvailable,
    },
  });
});
