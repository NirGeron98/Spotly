const Building = require("./../models/buildingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const buildingService = require("./../services/buildingService");
const factory = require("./handlerFactory");

/**
 * Update a building resident
 * @route PATCH /api/v1/buildings/:buildingId/residents/:userId
 * @access Private (Admin, Building Manager)
 */
exports.updateBuildingResident = catchAsync(async (req, res, next) => {
  const { buildingId, userId } = req.params;
  const { newResidentId } = req.body;

  if (!newResidentId) {
    return next(new AppError("New resident ID is required", 400));
  }

  // Delegate business logic to service layer
  const building = await buildingService.updateBuildingResident(
    buildingId,
    userId,
    newResidentId
  );

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

/**
 * Get building by building_number
 * @route GET /api/v1/buildings/byCode/:code
 * @access Public
 */
exports.getBuildingByCode = catchAsync(async (req, res, next) => {
  const { code } = req.params;

  if (!code) {
    return next(new AppError("Building code is required", 400));
  }

  // Delegate to service layer to find building by code
  const building = await buildingService.getBuildingByCode(code);

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

/**
 * Get all buildings with optional filtering
 * @route GET /api/v1/buildings
 * @access Public/Private depending on route protection
 */
exports.getAllBuildings = catchAsync(async (req, res, next) => {
  // Get filter criteria from query params if needed
  const filters = req.query;

  // Delegate to service layer
  const buildings = await buildingService.getAllBuildings(filters);

  res.status(200).json({
    status: "success",
    results: buildings.length,
    data: {
      buildings,
    },
  });
});

/**
 * Get building by ID
 * @route GET /api/v1/buildings/:id
 * @access Public/Private depending on route protection
 */
exports.getBuilding = catchAsync(async (req, res, next) => {
  const building = await buildingService.getBuildingById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});

/**
 * Create a new building - strictly restricted to admin users only
 * @route POST /api/v1/buildings
 * @access Private (Admin only)
 */
exports.createBuilding = catchAsync(async (req, res, next) => {
  // Check if user is admin (double security - also handled in route)
  if (req.user.role !== "admin") {
    return next(
      new AppError("You do not have permission to create buildings", 403)
    );
  }

  // Delegate building creation to service layer
  const newBuilding = await buildingService.createBuilding(req.body);

  res.status(201).json({
    status: "success",
    data: {
      building: newBuilding,
    },
  });
});

/**
 * Delete a building
 * @route DELETE /api/v1/buildings/:id
 * @access Private (Admin)
 */
exports.deleteBuilding = catchAsync(async (req, res, next) => {
  // Check if user is admin (double security)
  if (req.user.role !== "admin") {
    return next(
      new AppError("You do not have permission to delete buildings", 403)
    );
  }

  // Delegate to service layer
  await buildingService.deleteBuilding(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Add a resident to a building
 * @route POST /api/v1/buildings/:id/residents
 * @access Private (Admin, Building Manager)
 */
exports.addBuildingResident = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return next(new AppError("User ID is required", 400));
  }

  // Check authorization - only admin or the building manager can add residents
  const building = await buildingService.getBuildingById(id);

  if (
    req.user.role !== "admin" &&
    building.manager_id &&
    building.manager_id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You do not have permission to modify this building", 403)
    );
  }

  // Delegate to service layer
  const updatedBuilding = await buildingService.addResident(id, user_id);

  res.status(200).json({
    status: "success",
    data: {
      building: updatedBuilding,
    },
  });
});

/**
 * Remove a resident from a building
 * @route DELETE /api/v1/buildings/:id/residents/:userId
 * @access Private (Admin, Building Manager)
 */
exports.removeBuildingResident = catchAsync(async (req, res, next) => {
  const { id, userId } = req.params;

  // Check authorization - only admin or the building manager can remove residents
  const building = await buildingService.getBuildingById(id);

  if (
    req.user.role !== "admin" &&
    building.manager_id &&
    building.manager_id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You do not have permission to modify this building", 403)
    );
  }

  // Delegate to service layer
  const updatedBuilding = await buildingService.removeResident(id, userId);

  res.status(200).json({
    status: "success",
    data: {
      building: updatedBuilding,
    },
  });
});
