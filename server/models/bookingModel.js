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
  spot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkingSpot",
    required: [true, "Spot is required"],
  },
  start_datetime: {
    type: Date,
    default: Date.now,
    required: [true, "Start time is required"],
  },
  end_datetime: {
    type: Date,
    default: null,
  },
  duration_minutes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },
  base_rate: {
    type: Number,
    required: [true, "Base rate is required"],
  },
  final_amount: {
    type: Number,
    default: 0,
  },
  payment_status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to update the updated_at field
bookingSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Create indexes for efficient queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ spot: 1, status: 1 });
bookingSchema.index({ booking_type: 1, status: 1 });
bookingSchema.index({ payment_status: 1 });
bookingSchema.index({ start_datetime: 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
