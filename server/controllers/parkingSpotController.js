const ParkingSpot = require("../models/parkingSpotModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const parkingSpotService = require("../services/parkingSpotService");

// STANDARD CRUD OPERATIONS - Use factory pattern with sensible options
exports.getAllParkingSpots = factory.getAll(ParkingSpot, {
  popOptions: [
    { path: "building" },
    { path: "owner", select: "first_name last_name email" },
  ],
});

exports.getParkingSpot = factory.getOne(ParkingSpot, {
  popOptions: [
    { path: "user", select: "first_name last_name email" },
    { path: "owner", select: "first_name last_name email" },
    { path: "building" },
  ],
});

// For create, update, delete operations - use service layer due to complex business rules
exports.createParkingSpot = catchAsync(async (req, res, next) => {
  // Set owner to current user if not provided
  if (!req.body.owner) {
    req.body.owner = req.user.id;
  }

  const newParkingSpot = await parkingSpotService.createParkingSpot(req.body);

  res.status(201).json({
    status: "success",
    data: {
      parkingSpot: newParkingSpot,
    },
  });
});

exports.updateParkingSpot = catchAsync(async (req, res, next) => {
  const updatedParkingSpot = await parkingSpotService.updateParkingSpot(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot: updatedParkingSpot,
    },
  });
});

exports.deleteParkingSpot = catchAsync(async (req, res, next) => {
  await parkingSpotService.deleteParkingSpot(
    req.params.id,
    req.user.id,
    req.user.role
  );

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// SPECIALIZED OPERATIONS - Use service layer for domain-specific logic
exports.assignUser = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  const { id } = req.params;

  const parkingSpot = await parkingSpotService.assignUser(id, userId);

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot,
    },
  });
});

exports.unassignUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const parkingSpot = await parkingSpotService.unassignUser(id);

  res.status(200).json({
    status: "success",
    data: {
      parkingSpot,
    },
  });
});

exports.toggleAvailability = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const parkingSpot = await parkingSpotService.toggleAvailability(
    id,
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

exports.getParkingSpotsInBuilding = catchAsync(async (req, res, next) => {
  const { buildingId } = req.params;

  const parkingSpots =
    await parkingSpotService.getParkingSpotsByBuilding(buildingId);

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: {
      parkingSpots,
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
  const parkingSpots = await parkingSpotService.getOwnerParkingSpots(
    req.user.id
  );

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
