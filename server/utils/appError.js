class AppError extends Error {
  constructor(message, statusCode) {
    // Call parent class (Error) constructor
    super(message);

    // Custom HTTP status code (e.g., 400, 404, 500)
    this.statusCode = statusCode;

    // Define error status ('fail' for 4xx errors, otherwise 'error')
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Mark as operational error (trusted error we want to handle gracefully)
    this.isOperational = true;

    // Capture stack trace excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
