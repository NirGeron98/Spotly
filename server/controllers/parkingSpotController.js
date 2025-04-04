const ParkingSpot = require("../models/parkingSpotModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const parkingSpotService = require("../services/parkingSpotService");

// Get all parking spots with filtering
exports.getAllParkingSpots = factory.getAll(ParkingSpot);

// Get a specific parking spot with detailed information
exports.getParkingSpot = factory.getOne(ParkingSpot, { path: "user owner" });

// Create a new parking spot
exports.createParkingSpot = catchAsync(async (req, res, next) => {
  // Set owner to current user if not explicitly provided
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

// Update a parking spot
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

// Delete a parking spot
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

// Assign a user to a parking spot
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

// Unassign a user from a parking spot
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

// Change parking spot availability
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

// Get all parking spots in a building
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

// Get all available private parking spots
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

// Get all parking spots owned by current user
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

// Get all charging stations
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
