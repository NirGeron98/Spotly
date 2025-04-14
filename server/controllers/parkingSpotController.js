const ParkingSpot = require("../models/parkingSpotModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const parkingSpotService = require("../services/parkingSpotService");
const parkingFinder = require("../services/spotFinderService");

// Get & Create use factory
exports.getAllParkingSpots = factory.getAll(ParkingSpot);
exports.getParkingSpot = factory.getOne(ParkingSpot);
exports.createParkingSpot = factory.createOne(ParkingSpot);
exports.deleteParkingSpot = factory.deleteOne(ParkingSpot);

// ✅ Updated version – custom handler instead of factory
exports.updateParkingSpot = catchAsync(async (req, res, next) => {
  const updatedSpot = await parkingSpotService.updateParkingSpot(
    req.params.id,
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

exports.getParkingSpotsByBuilding = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getParkingSpotsByBuilding(
    req.params.buildingId
  );

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: {
      parkingSpots,
    },
  });
});

exports.assignUser = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.assignUser(
    req.params.id,
    req.body.userId
  );

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
  });
});

exports.unassignUser = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.unassignUser(req.params.id);

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
  });
});

exports.toggleAvailability = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.toggleAvailability(
    req.params.id,
    req.body.is_available,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
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
  const parkingSpot = await parkingSpotService.addAvailabilitySchedule(
    req.params.spotId,
    req.body,
    req.user.id
  );

  res.status(201).json({
    status: "success",
    data: { parkingSpot },
  });
});

exports.updateAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.updateAvailabilitySchedule(
    req.params.spotId,
    req.params.scheduleId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
  });
});

exports.removeAvailabilitySchedule = async (spotId, scheduleId, userId) => {
  const parkingSpot = await ParkingSpot.findById(spotId);
  if (!parkingSpot) {
    throw new AppError("Parking spot not found", 404);
  }

  if (parkingSpot.owner.toString() !== userId) {
    throw new AppError("You do not have permission to update this parking spot's availability", 403);
  }

  const scheduleIndex = parkingSpot.availability_schedule.findIndex(
    (schedule) => schedule._id.toString() === scheduleId
  );

  if (scheduleIndex === -1) {
    throw new AppError("Schedule not found", 404);
  }

  const schedule = parkingSpot.availability_schedule[scheduleIndex];

  await Booking.deleteOne({
    parkingSpot: spotId,
    schedule_id: schedule._id
  });

  parkingSpot.availability_schedule.splice(scheduleIndex, 1);
  await parkingSpot.save();

  return parkingSpot;
};


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

exports.releaseParkingSpot = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.releaseParkingSpot({
    ...req.body,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
  });
});

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
      20,
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
