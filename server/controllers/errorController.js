const AppError = require("./../utils/appError");

// Handle invalid MongoDB ObjectId (e.g., cast errors)
const handleCastErrorDB = (err) => {
  const message = `שדה לא תקין: ${err.path} = ${err.value}`;
  return new AppError(message, 400);
};

// Handle MongoDB duplicate field errors (code 11000)
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  const message = `הערך '${value}' כבר קיים בשדה '${field}'. אנא השתמש בפרטים אחרים.`;

  const error = new AppError(message, 400);
  error.code = 11000;
  error.keyPattern = err.keyPattern;
  error.keyValue = err.keyValue;

  return error;
};

// Handle validation errors from Mongoose schema
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `קלט שגוי: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

// Handle invalid JWT token
const handleJWTError = () =>
  new AppError("אסימון לא תקין. אנא התחבר מחדש.", 401);

// Handle expired JWT token
const handleJWTExpiredError = () =>
  new AppError("תוקף האסימון פג. אנא התחבר מחדש.", 401);

// Error response for development mode (full error details)
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Error response for production mode (safe messages only)
const sendErrorProd = (err, res) => {
  // Send detailed message only for known operational errors
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.code && { code: err.code }),
      ...(err.keyPattern && { keyPattern: err.keyPattern }),
      ...(err.keyValue && { keyValue: err.keyValue }),
    });
  } else {
    // Log unexpected programming errors
    console.error("ERROR 💥", err);

    // Send generic message for unknown errors
    res.status(500).json({
      status: "error",
      message: "אירעה שגיאה לא צפויה. נסה שוב מאוחר יותר.",
    });
  }
};

// Main error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.assign(err);

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
