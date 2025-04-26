const express = require("express");
const parkingSpotController = require("../controllers/parkingSpotController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

//=============================================================================
// COMMON ROUTES
//=============================================================================

router
  .route("/")
  .get(parkingSpotController.getAllParkingSpots)
  .post(parkingSpotController.createParkingSpot);

router
  .route("/:spotId")
  .get(parkingSpotController.getParkingSpot)
  .patch(parkingSpotController.updateParkingSpot)
  .delete(
    authController.restrictTo("admin", "building_manager"),
    parkingSpotController.deleteParkingSpot
  );

router
  .route("/:spotId/availability")
  .get(parkingSpotController.getAvailabilitySchedules);

router
  .route("/:spotId/availability/:scheduleId")
  .delete(parkingSpotController.removeAvailabilitySchedule);

router.get("/my-spots", parkingSpotController.getMyParkingSpots);
router.get("/charging-stations", parkingSpotController.getChargingStations);
router.get(
  "/private-available",
  parkingSpotController.getAvailablePrivateSpots
);
router.post("/find-optimal", parkingSpotController.findOptimalParkingSpots);

router.post(
  "/:spotId/availability-schedule",
  authController.restrictTo("private_prop_owner", "building_resident"),
  parkingSpotController.addAvailabilitySchedule
);
router.patch(
  "/:spotId/availability-schedule/:scheduleId",
  authController.restrictTo("private_prop_owner", "building_resident"),
  parkingSpotController.updateAvailabilitySchedule
);
router.delete(
  "/:spotId/availability-schedule/:scheduleId",
  authController.restrictTo("private_prop_owner", "building_resident"),
  parkingSpotController.removeAvailabilitySchedule
);

// Release parking routes (restricted to private property owners)
router.post(
  "/release",
  authController.restrictTo("private_prop_owner"),
  parkingSpotController.releaseParkingSpot
);
router.get(
  "/my-released",
  authController.restrictTo("private_prop_owner"),
  parkingSpotController.getMyReleasedSpots
);

// Admin and building manager restricted routes
router.post(
  "/",
  authController.restrictTo("admin", "building_manager"),
  parkingSpotController.createParkingSpot
);

module.exports = router;
