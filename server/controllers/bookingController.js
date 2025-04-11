const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const bookingService = require("../services/bookingService");

// Simple CRUD operations using factory
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// Complex operations using service
exports.createBooking = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  
  const booking = await bookingService.createBooking(req.body);
  res.status(201).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  const booking = await bookingService.updateBooking(
    req.params.id,
    req.body,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.getUserBookings = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;
  const bookings = await bookingService.getUserBookings(userId);

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});
