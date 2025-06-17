const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cors = require("cors");
const ParkingSpot = require("./models/parkingSpotModel");
const Booking = require("./models/bookingModel");
const ParkingManagementSystem = require("./utils/parkingManagementSystem");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const buildingRouter = require("./routes/buildingRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const parkingSpotRouter = require("./routes/parkingSpotRoutes");
const cron = require("node-cron");
const { runBatchAllocation } = require("./services/batchAllocationService");

const app = express();

// Instantiate and load ParkingManagementSystem
const pmsInstance = new ParkingManagementSystem({ ParkingSpot, Booking });
pmsInstance
  .loadFromDatabase()
  .then(() => console.log("ParkingManagementSystem loaded successfully."))
  .catch((err) =>
    console.error("Failed to load ParkingManagementSystem:", err)
  );

// You might want to make pmsInstance available to your controllers,
// e.g., by attaching it to `req` via middleware, or by exporting it and importing where needed.
// For simplicity in the controller example above, it was newed up, but a shared instance is better.
app.use((req, res, next) => {
  req.pms = pmsInstance; // Example: making it available on request object
  console.log("PMS instance attached to request object.");
  req.requestTime = new Date().toISOString();
  next();
});

app.get("/api/v1/ping", (req, res) => {
  res.send("pong from server");
});

// GLOBAL MIDDLEWARES

const allowedOrigins = [
  "http://localhost:3000",
  "https://spotly-one.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://spotly-one.vercel.app",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000, // this equals to 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});
// app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization agaisnt NoSQL query injection
app.use(mongoSanitize());

// app.use(
//   hpp({
//     whitelist: [],
//   })
// );

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/buildings", buildingRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/parking-spots", parkingSpotRouter);

app.all("*", (req, res, next) => {
  // Runs for all HTTP Methods
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// Schedule the task to run every night at 10:05 PM Jerusalem time.
// The cron format is: 'minute hour day-of-month month day-of-week'
// '5 22 * * *' means "at 22:05 (10:05 PM) every day".
cron.schedule(
  "5 22 * * *",
  () => {
    console.log("SCHEDULER: Triggering the nightly batch allocation job...");

    // Set the target date for the allocation to be "tomorrow"
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Normalize to the very start of the day

    // Run the allocation service
    runBatchAllocation(tomorrow);
  },
  {
    scheduled: true,
    timezone: "Asia/Jerusalem", // IMPORTANT: Set to your local timezone
  }
);

module.exports = app;
