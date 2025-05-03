const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ParkingSpot = require("../models/parkingSpotModel");

// Simple CRUD operations using factory
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// Create a new booking and mark the corresponding schedule as unavailable
exports.createBooking = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;

  const bookingStart = new Date(req.body.start_datetime);
  const bookingEnd = new Date(req.body.end_datetime);
  const desiredDate = bookingStart.toISOString().split("T")[0];

  const spot = await ParkingSpot.findById(req.body.spot);
  if (!spot) throw new AppError("Parking spot not found", 404);

  const matchedSchedule = spot.availability_schedule.find((schedule) => {
    const scheduleDate = schedule.date.toISOString().split("T")[0];
    if (scheduleDate !== desiredDate) return false;

    const [startHour, startMin] = schedule.start_time.split(":").map(Number);
    const [endHour, endMin] = schedule.end_time.split(":").map(Number);

    const scheduleStart = new Date(schedule.date);
    scheduleStart.setHours(startHour, startMin, 0);

    const scheduleEnd = new Date(schedule.date);
    scheduleEnd.setHours(endHour, endMin, 0);

    return (
      schedule.is_available === true &&
      scheduleStart <= bookingStart &&
      scheduleEnd >= bookingEnd
    );
  });

  if (matchedSchedule) {
    req.body.schedule = matchedSchedule._id;
    matchedSchedule.is_available = false;
    await spot.save();
  }

  const booking = await Booking.create(req.body);

  res.status(201).json({
    status: "success",
    data: { booking },
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
  
  // Get ALL bookings for the user, including cancelled ones
  const bookings = await Booking.find({
    user: userId
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

  // Find all completed bookings with pending or failed payment status
  const unpaidBookings = await Booking.find({
    user: userId,
    status: 'completed',
    payment_status: { $in: ['pending', 'failed'] }
  })
  .populate('spot')
  .sort({ end_datetime: -1 });

  res.status(200).json({
    status: 'success',
    data: {
      bookings: unpaidBookings
    }
  });
});


exports.confirmPayment = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const userId = req.user.id;

  // Find the booking and verify it belongs to the user
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
    status: 'completed',
    payment_status: { $in: ['pending', 'failed'] }
  });

  if (!booking) {
    return next(new AppError('Booking not found or already paid', 404));
  }

  // Update booking payment status to completed
  booking.payment_status = 'completed';
  booking.payment_date = new Date();
  await booking.save();

  // In a real application, you would process the payment here
  // with your payment provider (Stripe, PayPal, etc.)

  res.status(200).json({
    status: 'success',
    message: 'Payment confirmed successfully',
    data: {
      booking: booking
    }
  });
});