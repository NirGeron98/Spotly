const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const parkingSpotController = require("./../controllers/parkingSpotController");

const router = express.Router();

router.post(
  "/signup",
  authController.signup,
  parkingSpotController.createUserParkingSpot,
  authController.sendSignupResponse
);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.route("/").post(userController.createUser);

router.use(authController.protect); // FROM now on all the routes below are protected

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);

router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

router.patch('/preferences', userController.updatePreferences); 

// Admin routes
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;