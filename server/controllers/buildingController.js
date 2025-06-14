const Building = require("../models/buildingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const buildingService = require("../services/buildingService");

// Simple CRUD operations using factory
exports.getAllBuildings = factory.getAll(Building);
exports.getBuilding = factory.getOne(Building);
exports.createBuilding = factory.createOne(Building);
exports.updateBuilding = factory.updateOne(Building);
exports.deleteBuilding = factory.deleteOne(Building);

// Complex operations using service
exports.getBuildingByCode = catchAsync(async (req, res, next) => {
  const building = await buildingService.getBuildingByCode(req.params.code);

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

exports.addResident = catchAsync(async (req, res, next) => {
  const building = await buildingService.addResident(
    req.params.id,
    req.params.userId || req.body.userId
  );

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

exports.removeResident = catchAsync(async (req, res, next) => {
  const building = await buildingService.removeResident(
    req.params.id,
    req.params.userId || req.body.userId
  );

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

exports.updateBuildingResident = catchAsync(async (req, res, next) => {
  const building = await buildingService.updateBuildingResident(
    req.params.id,
    req.params.userId || req.body.userId,
    req.body.newResidentId
  );

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

exports.addResidentToBuilding = catchAsync(async (req, res, next) => {
  const { buildingId } = req.params;
  const { userId } = req.body;

  // Use the buildingService to add the resident
  const building = await buildingService.addResident(buildingId, userId);

  res.status(200).json({
    status: "success",
    message: "User added to building successfully",
    data: {
      building,
    },
  });
});