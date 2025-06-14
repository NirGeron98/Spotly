const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  booking_type: {
    type: String,
    enum: ["parking", "charging"],
    required: [true, "Booking type is required"],
  },
  booking_source: {
    type: String,
    enum: ["private_spot_rental", "resident_building_allocation"],
    required: [true, "Booking source is required"],
  },
  schedule: {
    type: mongoose.Schema.ObjectId,
    ref: "AvailabilitySchedule",
    default: null,
  },
  spot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkingSpot",
    required: [true, "Spot is required"],
  },
  start_datetime: {
    type: Date,
    // default: Date.now, // Default might not be desired if always provided
    required: [true, "Start time is required"],
  },
  end_datetime: {
    type: Date,
    // default: null, // Default might not be desired if always provided
    required: [true, "End time is required"],
  },
  timezone: {
    type: String,
    required: [true, "Timezone is required"],
  },
  status: {
    type: String,
    enum: ["active", "completed", "canceled", "pending_confirmation"], // Added pending_confirmation
    default: "active",
  },
  base_rate: {
    // For resident bookings, this can be 0
    type: Number,
    required: [
      true,
      "Base rate is required (can be 0 for non-charged bookings).",
    ],
    default: 0,
  },
  final_amount: {
    // For resident bookings, this can be 0
    type: Number,
    default: 0,
  },
  payment_status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded", "not_applicable"], // Added not_applicable
    default: "pending", // Default to pending, can be changed to not_applicable for resident
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  duration_minutes: {
    type: Number,
    default: 0,
  },
});

bookingSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  if (this.start_datetime && this.end_datetime) {
    const durationMs =
      this.end_datetime.getTime() - this.start_datetime.getTime();
    this.duration_minutes = Math.round(durationMs / (1000 * 60));
  }
  // If base_rate is 0, and payment_status is still 'pending', set to 'not_applicable'
  if (this.base_rate === 0 && this.payment_status === "pending") {
    this.payment_status = "not_applicable";
  }
  next();
});

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ spot: 1, status: 1 });
bookingSchema.index({ booking_type: 1, status: 1 });
bookingSchema.index({ payment_status: 1 });
bookingSchema.index({ start_datetime: 1, status: 1 });
bookingSchema.index({ booking_source: 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
