const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const userService = require("../services/userService");
const factory = require("./handlerFactory");

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. Please user /updateMyPassword",
        400
      )
    );

  // 2) Use service function to update user
  const updatedUser = await userService.updateMe(req.user.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await userService.deactivateUser(req.user.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

// Use factory handlers for simple CRUD operations
exports.getAllUsers = factory.getAll(User, {
  // Default to only active users

  filterBuilder: (req) => {
    // If showInactive query param is explicitly set to true, show all users
    return req.query.showInactive === "true" ? {} : { is_active: true };
  },
  transform: (user) => {
    // Return only non-sensitive fields
    return {
      _id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      profile_picture: user.profile_picture,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      is_active: user.is_active,
    };
  },
});

exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.updatePreferences = catchAsync(async (req, res, next) => {
  const updatedUser = await userService.updatePreferences(req.user.id, {
    distance_importance: req.body.distance_importance,
    price_importance: req.body.price_importance
  });

  res.status(200).json({
    status: 'success',
    data: {
      preferences: updatedUser.preferences
    }
  });
});
