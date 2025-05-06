const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ParkingManagementSystem = require("../utils/parkingManagementSystem");
const ParkingSpot = require("../models/parkingSpotModel");



exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

exports.createBooking = catchAsync(async (req, res, next) => {
  const pms = req.pms;
  const {
    spot: spotId,
    start_datetime,
    end_datetime,
    booking_type,
    base_rate,
  } = req.body;
  const userId = req.user.id;

  if (!spotId || !start_datetime || !end_datetime) {
    return next(
      new AppError(
        "Spot ID, start datetime, and end datetime are required.",
        400
      )
    );
  }

  let bookingStart, bookingEnd;
  try {
    bookingStart = new Date(start_datetime);
    bookingEnd = new Date(end_datetime);
    if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch (e) {
    return next(
      new AppError(
        "Invalid start or end datetime format. Please use ISO 8601 format.",
        400
      )
    );
  }

  if (bookingEnd <= bookingStart) {
    return next(
      new AppError("End datetime must be after start datetime.", 400)
    );
  }

  if (!pms.isLoaded) {
    await pms.loadFromDatabase().catch((err) => {
      console.error("Failed to load PMS data on demand:", err);
      return next(
        new AppError("System is initializing, please try again shortly.", 503)
      );
    });
  }
  if (!pms.isLoaded) {
    return next(
      new AppError("System is not ready, please try again later.", 503)
    );
  }

  const bookingDetails = {
    booking_type: booking_type || "parking",
    base_rate: base_rate,
  };

  const newBooking = await pms.createBookingAndSplitAvailability(
    spotId,
    bookingStart,
    bookingEnd,
    userId,
    bookingDetails
  );

  if (!newBooking) {
    return next(
      new AppError(
        "Failed to create booking. The slot might no longer be available.",
        400
      )
    );
  }

  res.status(201).json({
    status: "success",
    data: {
      booking: newBooking,
    },
  });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { booking },
  });
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
