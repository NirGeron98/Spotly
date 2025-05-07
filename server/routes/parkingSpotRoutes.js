const express = require("express");
const parkingSpotController = require("../controllers/parkingSpotController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/my-spots", parkingSpotController.getMyParkingSpots);

router
  .post("/private/find-optimal", parkingSpotController.findOptimalParkingSpots)
  .get("/private/charging-stations", parkingSpotController.getChargingStations)
  .get("/private", parkingSpotController.getPrivateSpots);

router.get("/building/:buildingId", parkingSpotController.getBuildingSpots)
router.post(
  '/building/find-available',
  authController.protect,
  authController.restrictTo('building_resident', "admin"),  
  parkingSpotController.findBuildingSpotForResident
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

// Release parking routes (restricted to private property owners)
// router.post(
//   "/release",
//   authController.restrictTo("private_prop_owner"),
//   parkingSpotController.add
// );
// router.get(
//   "/my-released",
//   authController.restrictTo("private_prop_owner"),
//   parkingSpotController.getMyReleasedSpots
// );

router
  .route("/")
  .get(parkingSpotController.getAllParkingSpots)
  .post(parkingSpotController.createUserParkingSpot);

module.exports = router;
