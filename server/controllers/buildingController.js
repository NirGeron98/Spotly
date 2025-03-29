const Building = require("./../models/buildingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

exports.updateBuildingResident = catchAsync(async (req, res, next) => {
  const { buildingId, userId } = req.params;
  const { newResidentId } = req.body;

  // Find the building by its ID
  const building = await Building.findById(buildingId);

  if (!building) {
    return next(new AppError("No building found with that ID", 404));
  }

  // Check if the resident exists in the building
  const resident = building.residents.find(
    (resident) => resident.user_id.toString() === userId
  );

  if (!resident) {
    return next(
      new AppError("No resident found with that ID in this building", 404)
    );
  }

  // Update the resident user ID
  resident.user_id = newResidentId;

  // Save the updated building document
  await building.save();

  res.status(200).json({
    status: "success",
    data: {
      building,
    },
  });
});
exports.getAllBuildings = factory.getAll(Building);
//exports.createBuilding = factory.createOne(Building);
exports.createBuilding = catchAsync(async (req, res, next) => {
  const { city, street, building_number } = req.body;

  // Check if a building with the same address already exists
  const existingBuilding = await Building.findOne({
    city,
    street,
    building_number,
  });

  if (existingBuilding) {
    return next(
      new AppError("Building with this address already exists!", 400)
    );
  }

  // Create the building if it doesn't exist
  const newBuilding = await Building.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      building: newBuilding,
    },
  });
});
exports.getBuilding = factory.getOne(Building);
exports.deleteBuilding = factory.deleteOne(Building);
