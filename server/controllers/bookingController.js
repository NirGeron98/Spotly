const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ParkingManagementSystem = require("../utils/parkingManagementSystem");
const ParkingSpot = require("../models/parkingSpotModel");
const parkingSpotService = require("../services/parkingSpotService");
const bookingService = require("../services/bookingService");

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  
  try {
    const canceledBooking = await bookingService.cancelBooking(bookingId, userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Booking successfully cancelled',
      data: {
        booking: canceledBooking
      }
    });
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError(error.message, 400));
  }
});

exports.createBooking = catchAsync(async (req, res, next) => {
  const { spot: spotId, start_datetime, end_datetime, booking_type, base_rate_override } = req.body;
  const userId = req.user.id;

  // 1. Required field validation
  if (!spotId || !start_datetime || !end_datetime) {
    return next(new AppError("Spot ID, start datetime, and end datetime are required.", 400));
  }

  // 2. Parse and validate datetime format
  let bookingStart, bookingEnd;
  try {
    bookingStart = new Date(start_datetime);
    bookingEnd = new Date(end_datetime);
    if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch (e) {
    return next(new AppError("Invalid datetime format. Please use ISO 8601 format.", 400));
  }

  // 3. Logical validation
  if (bookingEnd <= bookingStart) {
    return next(new AppError("End datetime must be after start datetime.", 400));
  }

  // 4. Call booking service
  try {
    const bookingDetails = { booking_type, base_rate_override };
    const newBooking = await bookingService.createBooking(
      userId, spotId, bookingStart, bookingEnd, bookingDetails
    );

    res.status(201).json({
      status: "success",
      data: { booking: newBooking }
    });
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError(error.message, 400));
  }
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  try {
    const booking = await bookingService.updateBooking(
      req.params.id, 
      req.body, 
      req.user.id
    );
    
    res.status(200).json({
      status: "success",
      data: { booking }
    });
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError(error.message, 400));
  }
});

exports.getUserBookings = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;

  const bookings = await Booking.find({
    user: userId,
  }).populate("spot");

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: { bookings },
  });
});

exports.getBookingForSchedule = catchAsync(async (req, res, next) => {
  const { spotId, scheduleId } = req.params;

  const booking = await Booking.findOne({
    spot: spotId,
    schedule: scheduleId,
    status: "active",
  }).populate("user");

  if (!booking) {
    return next(new AppError("לא נמצאה הזמנה תואמת לפינוי הזה", 404));
  }

  res.status(200).json({
    status: "success",
    data: { booking },
  });
});

exports.getUnpaidCompletedBookings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const unpaidBookings = await Booking.find({
    user: userId,
    status: "completed",
    payment_status: { $in: ["pending", "failed"] },
  })
    .populate("spot")
    .sort({ end_datetime: -1 });

  res.status(200).json({
    status: "success",
    data: {
      bookings: unpaidBookings,
    },
  });
});

exports.confirmPayment = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const userId = req.user.id;

  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
    status: "completed",
    payment_status: { $in: ["pending", "failed"] },
  });

  if (!booking) {
    return next(new AppError("Booking not found or already paid", 404));
  }

  booking.payment_status = "completed";
  booking.payment_date = new Date();
  await booking.save();

  res.status(200).json({
    status: "success",
    message: "Payment confirmed successfully",
    data: {
      booking: booking,
    },
  });
});
