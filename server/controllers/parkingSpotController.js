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
