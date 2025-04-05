const express = require("express");
const buildingController = require("./../controllers/buildingController");
const authController = require("./../controllers/authController");
const router = express.Router();

router
  .route("/")
  .get(buildingController.getAllBuildings)
  .post(authController.restrictTo("admin"), buildingController.createBuilding);

// Move the byCode route before the :id route to avoid conflicts
router.route("/byCode/:code").get(buildingController.getBuildingByCode);

router
  .route("/:id")
  .get(buildingController.getBuilding)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    buildingController.updateBuildingResident
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "building_manager"),
    buildingController.deleteBuilding
  );

module.exports = router;
