const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const bookingService = require("../services/bookingService");

// Simple CRUD operations using factory
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);

// Complex operations using service
exports.createBooking = catchAsync(async (req, res, next) => {
  // Set user to current user if not provided
  if (!req.body.user) req.body.user = req.user.id;

  const booking = await bookingService.createBooking(req.body);

  res.status(201).json({
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

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
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

exports.checkAvailability = catchAsync(async (req, res, next) => {
  const { parkingSpotId } = req.params;
  const { startTime, endTime } = req.query;

  if (!startTime || !endTime) {
    return next(
      new AppError("Start time and end time are required parameters", 400)
    );
  }

  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
    return next(new AppError("Invalid start time or end time format", 400));
  }

  const isAvailable = await bookingService.checkParkingSpotAvailability(
    parkingSpotId,
    parsedStartTime,
    parsedEndTime
  );

  res.status(200).json({
    status: "success",
    data: {
      isAvailable,
    },
  });
});
