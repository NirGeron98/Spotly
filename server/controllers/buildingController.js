const Building = require("./../models/buildingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const buildingService = require("./../services/buildingService");

// STANDARD CRUD OPERATIONS - Use factory pattern
exports.getAllBuildings = factory.getAll(Building, {
  popOptions: [{ path: "manager_id", select: "first_name last_name email" }],
});

exports.getBuilding = factory.getOne(Building, {
  popOptions: [
    { path: "manager_id", select: "first_name last_name email" },
    { path: "residents", select: "first_name last_name email" },
  ],
});

exports.createBuilding = factory.createOne(Building, {
  allowedFields: [
    "name",
    "address",
    "building_number",
    "manager_id",
    "total_floors",
  ],
});

exports.deleteBuilding = factory.deleteOne(Building, {
  beforeDelete: async (req) => {
    // Check if building has residents
    const building = await Building.findById(req.params.id);
    if (building && building.residents && building.residents.length > 0) {
      throw new AppError("Cannot delete a building with residents", 400);
    }
  },
});

// SPECIALIZED OPERATIONS - Use service layer
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

  const building = await buildingService.getBuildingByCode(code);

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
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

  // Check authorization through the service
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

  const updatedBuilding = await buildingService.removeResident(id, userId);

  res.status(200).json({
    status: "success",
    data: {
      building: updatedBuilding,
    },
  });
});

/**
 * Update a building resident
 * @route PATCH /api/v1/buildings/:buildingId/updateResident/:userId
 * @access Private (Admin, Building Manager)
 */
exports.updateBuildingResident = catchAsync(async (req, res, next) => {
  const { buildingId, userId } = req.params;
  const { newResidentId } = req.body;

  if (!newResidentId) {
    return next(new AppError("New resident ID is required", 400));
  }

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
