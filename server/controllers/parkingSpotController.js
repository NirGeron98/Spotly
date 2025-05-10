const ParkingSpot = require("../models/parkingSpotModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const parkingSpotService = require("../services/parkingSpotService");
const parkingFinder = require("../services/spotFinderService");
const Booking = require("../models/bookingModel");
const mongoose = require("mongoose");
const { parseISO, isValid, isBefore } = require("date-fns"); // Import necessary functions

// Get & Create use factory
exports.getAllParkingSpots = factory.getAll(ParkingSpot);
exports.getPrivateSpots = factory.getAll(ParkingSpot, { spot_type: "private" });
exports.getChargingStations = factory.getAll(ParkingSpot, {
  is_charging_station: true,
  spot_type: "private",
});
exports.getParkingSpot = factory.getOne(ParkingSpot);
exports.deleteParkingSpot = factory.deleteOne(ParkingSpot);

// ✅ Updated version – custom handler instead of factory
exports.updateParkingSpot = catchAsync(async (req, res, next) => {
  const updatedSpot = await parkingSpotService.updateParkingSpot(
    req.params.spotId,
    req.body,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot: updatedSpot,
    },
  });
});

// Complex operations using service layer
exports.createUserParkingSpot = catchAsync(async (req, res, next) => {
  if (
    !req.user ||
    !["private_prop_owner", "building_resident"].includes(req.user.role)
  ) {
    return next();
  }

  let parkingSpotData = {
    owner: req.user._id,
    is_available: true,
  };

  if (req.user.role === "private_prop_owner") {
    parkingSpotData.spot_type = "private";
    parkingSpotData.address = req.user.address;
  } else if (req.user.role === "building_resident" && req.user.building) {
    parkingSpotData.spot_type = "building";
    parkingSpotData.building = req.user.building;
    parkingSpotData.floor = req.body.floor || "1";
    parkingSpotData.spot_number =
      req.body.spot_number || `${req.user._id}-spot`;
  } else {
    return next();
  }

  try {
    const parkingSpot =
      await parkingSpotService.createParkingSpot(parkingSpotData);
    req.user.parking_spot = parkingSpot._id;
    await req.user.save({ validateBeforeSave: false });
    res.locals.parkingSpot = parkingSpot;
  } catch (error) {
    console.error("Failed to create parking spot:", error);
    res.locals.parkingSpotWarning = error.message;
  }

  next();
});

exports.getBuildingSpots = catchAsync(async (req, res, next) => {
  const { buildingId } = req.params;

  // Validate buildingId
  if (!mongoose.Types.ObjectId.isValid(buildingId)) {
    return next(new AppError("Invalid building ID format", 400));
  }

  // Query for spots in this building
  const spots = await ParkingSpot.find({
    building: buildingId,
    spot_type: "building",
  }).select("-__v");

  // If no spots found, still return success with empty array
  res.status(200).json({
    status: "success",
    results: spots.length,
    data: {
      spots,
    },
  });
});

exports.getAvailablePrivateSpots = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getAvailablePrivateSpots();

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});

exports.getMyParkingSpots = catchAsync(async (req, res, next) => {
  const ownerId = req.params.ownerId || req.user.id;
  const parkingSpots = await parkingSpotService.getOwnerParkingSpots(ownerId);
  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});

exports.getChargingStations = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getChargingStations();

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});

exports.getAvailableParkingSpots = catchAsync(async (req, res, next) => {
  const { startTime, endTime, ...filters } = req.query;

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

  const parkingSpots = await parkingSpotService.getAvailableParkingSpots(
    parsedStartTime,
    parsedEndTime,
    filters
  );

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});

exports.addAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const { spotId } = req.params;
  const userId = req.user.id;

  // --- Input Parsing and Validation ---
  // Expecting body like: { "start_datetime": "ISO_STRING", "end_datetime": "ISO_STRING", "timezone": "...", "type": "..." }
  const { start_datetime, end_datetime, timezone, type } = req.body;

  // Validate presence of required fields
  if (!start_datetime || !end_datetime || !timezone || !type) {
    return next(
      new AppError(
        "Please provide start_datetime, end_datetime, timezone, and type.",
        400
      )
    );
  }

  // ISO validation and time order validation
  let startUtc, endUtc;
  try {
    startUtc = parseISO(start_datetime);
    endUtc = parseISO(end_datetime);

    if (!isValid(startUtc) || !isValid(endUtc)) {
      throw new Error("Invalid ISO date format");
    }
  } catch (error) {
    return next(
      new AppError(
        "Invalid start_datetime or end_datetime format. Please provide valid ISO 8601 strings.",
        400
      )
    );
  }

  if (!isBefore(startUtc, endUtc)) {
    return next(new AppError("End time must be after start time.", 400));
  }

  // Prepare data for the service
  const scheduleData = {
    start_datetime: startUtc, // Pass Date object
    end_datetime: endUtc, // Pass Date object
    type: type,
  };

  // Call the service layer
  const newSchedule = await parkingSpotService.addAvailabilitySchedule(
    spotId,
    scheduleData, // Pass the prepared data
    userId
  );

  // Response
  res.status(201).json({
    status: "success",
    data: {
      schedule: newSchedule,
    },
  });
});

exports.getAvailabilitySchedules = catchAsync(async (req, res, next) => {
  const parkingSpot = await ParkingSpot.findById(req.params.spotId);

  if (!parkingSpot) {
    return next(new AppError("No parking spot found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    results: parkingSpot.availability_schedule
      ? parkingSpot.availability_schedule.length
      : 0,
    data: {
      schedules: parkingSpot.availability_schedule || [],
    },
  });
});

exports.updateAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.updateAvailabilitySchedule(
    req.params.spotId,
    req.params.scheduleId,
    req.body,
    req.user.id
  );

  req.updatedSpot = parkingSpot; // Store the updated spot for potential middleware use
  if (!next.called) {
    res.status(200).json({
      status: "success",
      data: {
        parkingSpot,
      },
    });
  } else {
    next();
  }
});

exports.removeAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { spotId, scheduleId } = req.params;

    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(spotId) ||
      !mongoose.Types.ObjectId.isValid(scheduleId)
    ) {
      throw new AppError("Invalid spotId or scheduleId format", 400);
    }

    const parkingSpot = await ParkingSpot.findById(spotId).session(session);

    if (!parkingSpot) {
      throw new AppError("Parking spot not found", 404);
    }

    const scheduleIndex = parkingSpot.availability_schedule.findIndex(
      (schedule) => schedule._id.toString() === scheduleId
    );

    if (scheduleIndex === -1) {
      throw new AppError("Schedule not found", 404);
    }

    // Remove related bookings
    await Booking.deleteMany({ spot: spotId, schedule: scheduleId }).session(
      session
    );

    // Remove the schedule
    parkingSpot.availability_schedule.splice(scheduleIndex, 1);
    await parkingSpot.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

exports.getMyReleasedSpots = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getOwnerParkingSpots(
    req.user.id
  );

  const releasedSpots = parkingSpots.filter(
    (spot) =>
      spot.availability_schedule && spot.availability_schedule.length > 0
  );

  res.status(200).json({
    status: "success",
    results: releasedSpots.length,
    data: { parkingSpots: releasedSpots },
  });
});

// exports.releaseParkingSpot = catchAsync(async (req, res, next) => {
//   const parkingSpot = await parkingSpotService.releaseParkingSpot({
//     ...req.body,
//     userId: req.user.id,
//   });

//   res.status(200).json({
//     status: "success",
//     data: { parkingSpot },
//   });
// });

/**
 * Find optimal parking spots based on user criteria
 * Uses the ParkingSpotFinder algorithm to rank spots by proximity, price, and other factors
 */

exports.findOptimalParkingSpots = catchAsync(async (req, res, next) => {
  const {
    latitude,
    longitude,
    date,
    startTime,
    endTime,
    maxPrice = 1000,
    is_charging_station,
    charger_type,
    timezone = "UTC",
  } = req.body;

  // Validate required parameters
  if (!latitude || !longitude || !date || !startTime || !endTime) {
    return next(
      new AppError("Missing required parameters for finding parking spots", 400)
    );
  }

  // Validate date and time formats
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!dateTimeRegex.test(date)) {
    return next(new AppError("Invalid date format. Use YYYY-MM-DD", 400));
  }

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return next(
      new AppError("Invalid time format. Use HH:MM in 24-hour format", 400)
    );
  }

  // Create formatted datetime strings
  const startTimeStr = `${date} ${startTime}`;
  const endTimeStr = `${date} ${endTime}`;

  // Additional filters
  const additionalFilters = {};
  if (is_charging_station) additionalFilters.is_charging_station = true;
  if (charger_type) additionalFilters.charger_type = charger_type;

  try {
    // Find optimal parking spots
    const excludeOwnerId = req.user?.id;
    const rankedSpots = await parkingFinder.findParkingSpots(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(maxPrice),
      startTimeStr,
      endTimeStr,
      additionalFilters,
      20, // maxResults
      timezone,
      excludeOwnerId
    );

    if (rankedSpots.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: {
          parkingSpots: [],
        },
        message: "No available parking spots found matching your criteria",
      });
    }

    // Format results for API response
    const formattedResults = parkingFinder.formatResults(rankedSpots);

    // Return results
    res.status(200).json({
      status: "success",
      results: formattedResults.length,
      data: {
        parkingSpots: formattedResults,
      },
    });
  } catch (error) {
    return next(
      new AppError(`Error finding optimal parking spots: ${error.message}`, 500)
    );
  }
});

exports.findBuildingSpotForResident = catchAsync(async (req, res, next) => {
  // 1. First verify user role is building_resident
  if (req.user.role !== 'building_resident') {
    return next(new AppError('Only building residents can search for building spots', 403));
  }

  const { building_id, start_datetime, end_datetime } = req.body;
  const userId = req.user.id;

  // 2. Validate required parameters
  if (!building_id || !start_datetime || !end_datetime) {
    return next(new AppError('Building ID, start datetime, and end datetime are required', 400));
  }

  // 3. Parse and validate dates
  let bookingStart, bookingEnd;
  try {
    bookingStart = new Date(start_datetime);
    bookingEnd = new Date(end_datetime);
    if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch (e) {
    return next(new AppError('Invalid datetime format. Please use ISO 8601 format.', 400));
  }

  if (bookingEnd <= bookingStart) {
    return next(new AppError('End datetime must be after start datetime.', 400));
  }

  try {
    // 4. Find an available spot in the building
    const availableSpot = await parkingSpotService.findAvailableBuildingSpot(
      building_id,
      bookingStart,
      bookingEnd,
      userId
    );

    if (!availableSpot) {
      return next(new AppError('No available spots found in your building for the requested time period', 404));
    }

    // 5. Create a booking using the booking service
    const bookingService = require('../services/bookingService');
    const bookingDetails = {
      booking_type: 'parking',
      booking_source: 'resident_building_allocation',
      status: 'active',
      payment_status: 'not_required' // Building spots don't require payment
    };

    const booking = await bookingService.createBooking(
      userId,
      availableSpot._id,
      bookingStart,
      bookingEnd,
      bookingDetails
    );

    // 6. Return both the spot and booking details
    res.status(200).json({
      status: 'success',
      data: {
        spot: availableSpot,
        booking: booking,
        start_datetime: bookingStart,
        end_datetime: bookingEnd
      }
    });
  } catch (error) {
    if (error.statusCode === 403) {
      return next(new AppError('You can only search for spots in your own building', 403));
    }
    throw error;
  }
});
