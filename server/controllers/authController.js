const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const authService = require("../services/authService");
const { sendEmail, createPasswordResetEmail } = require("../utils/email");

// Signing up a new user
exports.signup = catchAsync(async (req, res, next) => {
  // Create user with service
  const newUser = await authService.signup(req.body);

  // Generate token
  const { token, cookieOptions } = authService.createAndSendToken(newUser, 201);

  // Set cookie
  res.cookie("jwt", token, cookieOptions);

  // Store for next middleware
  res.locals.user = newUser;
  res.locals.token = token;
  req.user = newUser;

  next();
});

exports.sendSignupResponse = (req, res) => {
  // Create response with user and token
  const responseData = {
    status: "success",
    token: res.locals.token,
    data: { user: res.locals.user },
  };

  // Add parking spot to response if created
  if (res.locals.parkingSpot) {
    responseData.data.parkingSpot = res.locals.parkingSpot;
  }

  // Add warning if spot creation failed
  if (res.locals.parkingSpotWarning) {
    responseData.warnings = {
      parkingSpot: res.locals.parkingSpotWarning,
    };
  }

  res.status(201).json(responseData);
};

// Logging in a user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await authService.login(email, password);

  // Generate token and respond
  const { token, cookieOptions } = authService.createAndSendToken(
    user,
    200,
    res
  );

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

// Protecting routes
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

  // 2) Verify token and get user
  const freshUser = await authService.protect(token);

  // 3) Grant access to protected route
  req.user = freshUser;
  next();
});

// Restricting access based on roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      authService.restrictTo(...roles)(req.user);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Updating password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent, password, passwordConfirm } = req.body;

  const user = await authService.updatePassword(
    req.user,
    passwordCurrent,
    password,
    passwordConfirm
  );

  // Log user in and send token
  const { token, cookieOptions } = authService.createAndSendToken(
    user,
    200,
    res
  );

  res.cookie("jwt", token, cookieOptions);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user and generate token
  const { user, resetToken } = await authService.forgotPassword(req.body.email);

  // 2) Send email with token
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    const emailContent = createPasswordResetEmail(user, resetURL);

    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message: emailContent.text,
      html: emailContent.html,
    });

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

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  // Use service to reset password
  const user = await authService.resetPassword(
    token,
    password,
    passwordConfirm
  );

  // Log user in, send JWT
  const tokenResponse = authService.createAndSendToken(user, 200, res);

  res.cookie("jwt", tokenResponse.token, tokenResponse.cookieOptions);

  res.status(200).json({
    status: "success",
    token: tokenResponse.token,
  });
});

// Logout
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};