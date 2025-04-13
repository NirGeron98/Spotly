const ParkingSpot = require("../models/parkingSpotModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const parkingSpotService = require("../services/parkingSpotService");

// Use factory functions for simple CRUD operations
exports.getAllParkingSpots = factory.getAll(ParkingSpot);
exports.getParkingSpot = factory.getOne(ParkingSpot);
exports.createParkingSpot = factory.createOne(ParkingSpot);
exports.updateParkingSpot = factory.updateOne(ParkingSpot);
exports.deleteParkingSpot = factory.deleteOne(ParkingSpot);

// Complex operations using service layer
// In parkingSpotController.js
exports.createUserParkingSpot = catchAsync(async (req, res, next) => {
  // Skip if there's no user or if not the right role
  if (
    !req.user ||
    !["private_prop_owner", "building_resident"].includes(req.user.role)
  ) {
    return next();
  }

  // Create different parking spot based on user role
  let parkingSpotData = {
    owner: req.user._id,
    is_available: true,
  };

  if (req.user.role === "private_prop_owner") {
    parkingSpotData.spot_type = "private";
    parkingSpotData.address = req.user.address; // Use address from user profile
    // Add any other private spot specific fields
  } else if (req.user.role === "building_resident" && req.user.building) {
    parkingSpotData.spot_type = "building";
    parkingSpotData.building = req.user.building;
    // Optional fields with defaults for building spots
    parkingSpotData.floor = req.body.floor || "1";
    parkingSpotData.spot_number =
      req.body.spot_number || `${req.user._id}-spot`;
  } else {
    // Missing required data
    return next();
  }

  try {
    // Use the service for validation and creation
    const parkingSpot =
      await parkingSpotService.createParkingSpot(parkingSpotData);

    // Update user with their parking spot
    req.user.parking_spot = parkingSpot._id;
    await req.user.save({ validateBeforeSave: false });

    // Add parking spot to response
    res.locals.parkingSpot = parkingSpot;
  } catch (error) {
    // If spot creation fails, continue anyway but log error
    console.error("Failed to create parking spot:", error);
    // Optional: add a warning to the response
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
    data: {
      parkingSpot,
    },
  });
});

exports.unassignUser = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.unassignUser(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot,
    },
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
    data: {
      parkingSpot,
    },
  });
});

exports.getAvailablePrivateSpots = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getAvailablePrivateSpots();

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: {
      parkingSpots,
    },
  });
});

exports.getMyParkingSpots = catchAsync(async (req, res, next) => {
  const ownerId = req.params.ownerId || req.user.id;
  const parkingSpots = await parkingSpotService.getOwnerParkingSpots(ownerId);

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: {
      parkingSpots,
    },
  });
});

exports.getChargingStations = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getChargingStations();

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: {
      parkingSpots,
    },
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
    data: {
      parkingSpots,
    },
  });
});

// Availability schedule management
exports.addAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const { spotId } = req.params;
  const scheduleData = req.body;
  const userId = req.user.id;

  const parkingSpot = await parkingSpotService.addAvailabilitySchedule(
    spotId,
    scheduleData,
    userId
  );

  res.status(201).json({
    status: "success",
    data: {
      parkingSpot,
    },
  });
});

exports.updateAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const { spotId, scheduleId } = req.params;
  const scheduleData = req.body;
  const userId = req.user.id;

  const parkingSpot = await parkingSpotService.updateAvailabilitySchedule(
    spotId,
    scheduleId,
    scheduleData,
    userId
  );

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot,
    },
  });
});

exports.removeAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const { spotId, scheduleId } = req.params;
  const userId = req.user.id;

  const parkingSpot = await parkingSpotService.removeAvailabilitySchedule(
    spotId,
    scheduleId,
    userId
  );

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot,
    },
  });
});

exports.getMyReleasedSpots = catchAsync(async (req, res, next) => {
  const parkingSpots = await parkingSpotService.getOwnerParkingSpots(
    req.user.id
  );

  // Filter spots to only include those with availability schedules
  const releasedSpots = parkingSpots.filter(
    (spot) =>
      spot.availability_schedule && spot.availability_schedule.length > 0
  );

  res.status(200).json({
    status: "success",
    results: releasedSpots.length,
    data: {
      parkingSpots: releasedSpots,
    },
  });
});

exports.releaseParkingSpot = catchAsync(async (req, res, next) => {
  const spotData = {
    ...req.body,
    userId: req.user.id,
  };

  const parkingSpot = await parkingSpotService.releaseParkingSpot(spotData);

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot,
    },
  });
});
