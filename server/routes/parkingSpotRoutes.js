const express = require("express");
const parkingSpotController = require("../controllers/parkingSpotController");
const authController = require("../controllers/authController");
const { runBatchAllocation } = require("../services/batchAllocationService");

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/building/run-test-batch", async (req, res) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  await runBatchAllocation(tomorrow);
  res.send("Batch job executed for testing.");
});

router.get("/my-spots", parkingSpotController.getMyParkingSpots);

router
  .post("/private/find-optimal", parkingSpotController.findOptimalParkingSpots)
  .get("/private/charging-stations", parkingSpotController.getChargingStations)
  .get("/private", parkingSpotController.getPrivateSpots);

router.get("/building/:buildingId", parkingSpotController.getBuildingSpots);

// Route for building residents to find available spots
router.post(
  "/building/find-available",
  authController.restrictTo("building_resident"), // Explicitly restrict to building residents
  parkingSpotController.handleBuildingParkingRequest
);

router
  .route("/:spotId")
  .get(parkingSpotController.getParkingSpot)
  .patch(parkingSpotController.updateParkingSpot)
  .delete(
    authController.restrictTo("admin", "building_manager"),
    parkingSpotController.deleteParkingSpot
  );

router
  .route("/:spotId/availability-schedule/:scheduleId")
  .delete(
    authController.restrictTo("private_prop_owner", "building_resident"),
    parkingSpotController.removeAvailabilitySchedule
  )
  .patch(
    authController.restrictTo("private_prop_owner", "building_resident"),
    parkingSpotController.updateAvailabilitySchedule
  );

router
  .route("/:spotId/availability-schedule")
  .get(parkingSpotController.getAvailabilitySchedules)
  .post(
    authController.restrictTo("private_prop_owner", "building_resident"),
    parkingSpotController.addAvailabilitySchedule
  );

router
  .route("/")
  .get(parkingSpotController.getAllParkingSpots)
  .post(parkingSpotController.createUserParkingSpot);

module.exports = router;
