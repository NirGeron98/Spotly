const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose"); // Ensure mongoose is imported
const User = require("../models/userModel");
const Building = require("../models/buildingModel"); // Ensure Building model is imported
const AppError = require("../utils/appError");
const { filterObj } = require("../utils/filterObj"); // Ensure this utility is imported

// Helper functions
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createAndSendToken = (user, statusCode, res) => {
  const token = this.signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // Remove sensitive fields from the output
  user.password = undefined;

  return {
    token,
    cookieOptions,
    user,
  };
};

// Auth business logic
exports.signup = async (userData) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("data: ", userData);
  try {
    // Define allowed fields for all roles
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "password",
      "passwordConfirm",
      "phone_number",
      "address",
      "resident_building",
      "owned_parking_spots",
      "apartment_number",
      "spot_type",
      "spot_number",
      "spot_floor",
    ];

    // Filter user data to only include allowed fields
    const filteredUserData = filterObj(userData, ...allowedFields);
    console.log("filtered data: ", filteredUserData);

    // Explicitly handle role assignment - restrict admin
    if (userData.role && userData.role !== "admin") {
      const allowedRoles = ["user", "building_resident", "private_prop_owner"];
      if (allowedRoles.includes(userData.role)) {
        filteredUserData.role = userData.role;
      } else {
        filteredUserData.role = "user"; // Default for unrecognized roles
      }
    } else {
      filteredUserData.role = "user"; // Default role
    }

    // Validate role-specific fields
    if (filteredUserData.role === "building_resident") {
      if (!filteredUserData.resident_building) {
        throw new AppError(
          "Building residents must be assigned to a building",
          400
        );
      }

      // Verify building exists
      const buildingExists = await Building.findById(
        filteredUserData.resident_building
      ).session(session);
      if (!buildingExists) {
        throw new AppError("The specified building does not exist", 404);
      }
    }

    // Create new user with the session
    const newUser = await User.create([filteredUserData], { session });
    const userId = newUser[0]._id;

    // If this is a building resident, update the building's residents array
    if (
      filteredUserData.role === "building_resident" &&
      filteredUserData.resident_building
    ) {
      const buildingId = filteredUserData.resident_building;

      // Add user to building's residents array
      await Building.findByIdAndUpdate(
        buildingId,
        { $addToSet: { residents: userId } }, // $addToSet prevents duplicates
        { session, new: true }
      );

      // Create a parking spot for this building resident
      const ParkingSpot = require("../models/parkingSpotModel");
      const parkingSpotData = {
        spot_type: "building",
        spot_number: filteredUserData.spot_number,
        spot_floor: filteredUserData.spot_floor,
        building: buildingId,
        owner: userId,
      };
      console.log("parking spot data: ", parkingSpotData);
      // Create the parking spot
      const newParkingSpot = await ParkingSpot.create([parkingSpotData], {
        session,
      });

      // Add the parking spot reference to the user
      await User.findByIdAndUpdate(
        userId,
        { $push: { owned_parking_spots: newParkingSpot[0]._id } },
        { session }
      );
    }

    // If this is a private property owner, create a private parking spot for them
    if (
      filteredUserData.role === "private_prop_owner" &&
      filteredUserData.address
    ) {
      const ParkingSpot = require("../models/parkingSpotModel");
      const parkingSpotData = {
        spot_type: "private",
        is_available: true,
        hourly_price: 0, // Default price, user will need to update this
        owner: userId,
        address: filteredUserData.address,
      };

      // Create the parking spot
      const newParkingSpot = await ParkingSpot.create([parkingSpotData], {
        session,
      });

      // Add the parking spot reference to the user
      await User.findByIdAndUpdate(
        userId,
        { $push: { owned_parking_spots: newParkingSpot[0]._id } },
        { session }
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return newUser[0];
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error; // Re-throw for controller to handle
  }
};

exports.login = async (email, password) => {
  // Check if email and password exist
  if (!email || !password) {
    throw new AppError("Please provide email and password!", 400);
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  return user;
};

exports.protect = async (token) => {
  // 1) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 2) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    throw new AppError(
      "The user belonging to this token no longer exists.",
      401
    );
  }

  // 3) Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      "User recently changed password! Please log in again.",
      401
    );
  }

  return freshUser;
};

exports.restrictTo = (...roles) => {
  return (user) => {
    // roles is an array ['admin', 'lead-guide']
    if (!roles.includes(user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403
      );
    }
    return true;
  };
};

exports.updatePassword = async (
  user,
  currentPassword,
  password,
  passwordConfirm
) => {
  // 1) Get user from collection
  const updatedUser = await User.findById(user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (
    !(await updatedUser.correctPassword(currentPassword, updatedUser.password))
  ) {
    throw new AppError("Your current password is wrong.", 401);
  }

  // 3) If so, update password
  updatedUser.password = password;
  updatedUser.passwordConfirm = passwordConfirm;
  await updatedUser.save();

  return updatedUser;
};

exports.forgotPassword = async (email) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("There is no user with that email address.", 404);
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  return { user, resetToken };
};

exports.resetPassword = async (token, password, passwordConfirm) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return user;
};