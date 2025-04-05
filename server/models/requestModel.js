const mongoose = require("mongoose");

// For shared parking requests within buildings
const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
    required: [true, "Building is required"],
  },
  start_datetime: {
    type: Date,
    required: [true, "Start date and time is required"],
  },
  end_datetime: {
    type: Date,
    required: [true, "End date and time is required"],
    validate: {
      validator: function (value) {
        return value > this.start_datetime;
      },
      message: "End time must be after start time",
    },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "active", "completed", "cancelled"],
    default: "pending",
  },
  assigned_spot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BuildingParkingSpot",
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

// Uncomment these indexes for better query performance
requestSchema.index({ building: 1, status: 1 });
requestSchema.index({ user: 1, status: 1 });
requestSchema.index({ start_datetime: 1, end_datetime: 1, status: 1 });
requestSchema.index({ assigned_spot: 1, status: 1 });

// Add pre-save middleware to update timestamps
requestSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
