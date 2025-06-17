const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cors = require("cors");
const cron = require("node-cron");

const ParkingSpot = require("./models/parkingSpotModel");
const Booking = require("./models/bookingModel");
const ParkingManagementSystem = require("./utils/parkingManagementSystem");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const userRouter = require("./routes/userRoutes");
const buildingRouter = require("./routes/buildingRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const parkingSpotRouter = require("./routes/parkingSpotRoutes");
const { runBatchAllocation } = require("./services/batchAllocationService");

const app = express();

// ------------------------
// 1. CORS CONFIGURATION
// ------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001", // Add any other dev origin you use
  "https://spotly-one.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or Postman) or from allowed domains
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError("Not allowed by CORS", 403));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"]
};

// Enable CORS globally
app.use(cors(corsOptions));

// Allow preflight (OPTIONS) requests for all routes
app.options("*", cors(corsOptions));

// ------------------------
// 2. SECURITY MIDDLEWARES
// ------------------------

// Set various HTTP headers to secure the app
app.use(helmet());

// Sanitize request data to prevent NoSQL injection
app.use(mongoSanitize());

// Optionally prevent parameter pollution (e.g., ?sort=price&sort=duration)
// app.use(hpp());

// ------------------------
// 3. LOGGING & RATE LIMITING
// ------------------------

// Use morgan for logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit repeated requests from the same IP
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!"
});
// Optional: uncomment to enable
// app.use("/api", limiter);

// ------------------------
// 4. PARSING REQUEST BODY
// ------------------------

// Parse incoming JSON payloads
app.use(express.json({ limit: "10kb" }));

// ------------------------
// 5. LOAD PARKING SYSTEM
// ------------------------

const pmsInstance = new ParkingManagementSystem({ ParkingSpot, Booking });
pmsInstance
  .loadFromDatabase()
  .then(() => console.log("ParkingManagementSystem loaded successfully."))
  .catch((err) => console.error("Failed to load ParkingManagementSystem:", err));

// Attach to request object for usage in controllers
app.use((req, res, next) => {
  req.pms = pmsInstance;
  req.requestTime = new Date().toISOString();
  next();
});

// ------------------------
// 6. TEST ROUTE
// ------------------------

app.get("/api/v1/ping", (req, res) => {
  res.send("pong from server");
});

// ------------------------
// 7. MAIN ROUTES
// ------------------------

app.use("/api/v1/users", userRouter);
app.use("/api/v1/buildings", buildingRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/parking-spots", parkingSpotRouter);

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// ------------------------
// 8. CRON JOB – NIGHTLY ALLOCATION
// ------------------------

// Run every day at 22:05 (10:05 PM) Jerusalem time
cron.schedule(
  "5 22 * * *",
  () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of the day
    runBatchAllocation(tomorrow);
  },
  {
    scheduled: true,
    timezone: "Asia/Jerusalem"
  }
);

module.exports = app;
