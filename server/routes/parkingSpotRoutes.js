const express = require("express");
const parkingSpotController = require("../controllers/parkingSpotController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Routes accessible by all authenticated users
router.get("/", parkingSpotController.getAllParkingSpots);
router.get("/my-spots", parkingSpotController.getMyParkingSpots);
router.get("/charging-stations", parkingSpotController.getChargingStations);
router.get(
  "/private-available",
  parkingSpotController.getAvailablePrivateSpots
);

router.get("/:id", parkingSpotController.getParkingSpot);

// Routes for creating new spots and managing personal spots
router.post("/", parkingSpotController.createParkingSpot);
router.patch("/:id", parkingSpotController.updateParkingSpot);
router.delete("/:id", parkingSpotController.deleteParkingSpot);
router.patch("/:id/availability", parkingSpotController.toggleAvailability);

// Routes for managing availability schedules - available for both private property owners and building residents
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

// Release parking routes - restricted to private property owners
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

// Routes restricted to admin and building managers
router.use(authController.restrictTo("admin", "building_manager"));
router.patch("/:id/assign", parkingSpotController.assignUser);
router.patch("/:id/unassign", parkingSpotController.unassignUser);

module.exports = router;
