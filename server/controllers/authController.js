const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const authService = require("../services/authService");
const Email = require("./../utils/email");

exports.signup = catchAsync(async (req, res, next) => {
  // Use auth service to handle signup business logic
  const newUser = await authService.signup(req.body);

  // Create token and send response
  const { token, cookieOptions, user } = authService.createAndSendToken(
    newUser,
    201,
    res
  );

  res.cookie("jwt", token, cookieOptions);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Use auth service for login business logic
  const user = await authService.login(email, password);

  // Create and send token
  const { token, cookieOptions } = authService.createAndSendToken(
    user,
    200,
    res
  );

  res.cookie("jwt", token, cookieOptions);

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // Use auth service for token verification
  const currentUser = await authService.protect(token);

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    authService.restrictTo(...roles)(req.user);
    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Use auth service for password reset logic
  const { user, resetToken } = await authService.forgotPassword(req.body.email);

  // Send reset email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Use auth service to reset password
  const user = await authService.resetPassword(
    req.params.token,
    req.body.password,
    req.body.passwordConfirm
  );

  // Log the user in, send JWT
  const { token, cookieOptions } = authService.createAndSendToken(
    user,
    200,
    res
  );

  res.cookie("jwt", token, cookieOptions);

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Use auth service to update password
  const updatedUser = await authService.updatePassword(
    req.user,
    req.body.passwordCurrent,
    req.body.password,
    req.body.passwordConfirm
  );

  // Log user in with new token
  const { token, cookieOptions } = authService.createAndSendToken(
    updatedUser,
    200,
    res
  );

  res.cookie("jwt", token, cookieOptions);

  res.status(200).json({
    status: "success",
    token,
  });
});
