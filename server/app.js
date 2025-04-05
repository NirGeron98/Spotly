const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const buildingRouter = require("./routes/buildingRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const requestRouter = require("./routes/requestRoutes");
//const spotRouter = require("./routes/spotRoutes");
const app = express();

app.get("/api/v1/ping", (req, res) => {
  res.send("pong from server");
});

// GLOBAL MIDDLEWARES

// Enabling CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: '*'
}));


// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // this equals to 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization agaisnt NoSQL query injection
app.use(mongoSanitize());

// app.use(
//   hpp({
//     whitelist: [],
//   })
// );

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/buildings", buildingRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/requests", requestRouter);

app.all("*", (req, res, next) => {
  // Runs for all HTTP Methods
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

