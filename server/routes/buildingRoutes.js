const express = require("express");
const buildingController = require("./../controllers/buildingController");
const authController = require("./../controllers/authController");
const router = express.Router();

// Public route for getting buildings by code
router.route("/byCode/:code").get(buildingController.getBuildingByCode);

// Public route for getting all buildings - may need protection based on your requirements
router.route("/").get(buildingController.getAllBuildings);

// PROTECTED ROUTES - require authentication
// Only admins can create buildings
router
  .route("/")
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    buildingController.createBuilding
  );

// Routes for specific buildings
router
  .route("/:id")
  .get(buildingController.getBuilding)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    buildingController.deleteBuilding
  );

// Routes for managing residents
router
  .route("/:id/residents")
  .post(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    buildingController.addBuildingResident
  );

router
  .route("/:id/residents/:userId")
  .delete(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    buildingController.removeBuildingResident
  );

// Route for updating a building resident
router
  .route("/:buildingId/updateResident/:userId")
  .patch(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    buildingController.updateBuildingResident
  );

module.exports = router;
