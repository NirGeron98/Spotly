const ParkingSpot = require("../models/parkingSpotModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const parkingSpotService = require("../services/parkingSpotService");

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

exports.removeAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const parkingSpot = await parkingSpotService.removeAvailabilitySchedule(
    req.params.spotId,
    req.params.scheduleId,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
  });
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
