const mongoose = require("mongoose");
const availabilityScheduleSchema = require("./availabilityScheduleModel");
const geocoder = require("../utils/geocoder");

const parkingSpotSchema = new mongoose.Schema(
  {
    // Common field defining the type of parking spot
    spot_type: {
      type: String,
      required: true,
      enum: ["building", "private"],
      default: "building",
    },

    // Fields specific to building spots
    spot_number: {
      type: String,
      required: function () {
        return this.spot_type === "building";
      },
      trim: true,
    },
    spot_floor: {
      type: String,
      required: function () {
        return this.spot_type === "building";
      },
      trim: true,
    },
    building: {
      type: mongoose.Schema.ObjectId,
      ref: "Building",
      required: function () {
        return this.spot_type === "building";
      },
    },

    // Fields specific to private spots
    is_charging_station: {
      type: Boolean,
      default: false,
    },
    charger_type: {
      type: String,
      enum: ["Type 1", "Type 2", "CCS", "CHAdeMO", "Other", null],
      validate: {
        validator: function (val) {
          // Charger type is required only if it's a charging station
          return !this.is_charging_station || (this.is_charging_station && val);
        },
        message: "Charger type is required for charging stations",
      },
    },
    hourly_price: {
      type: Number,
      validate: {
        validator: function (val) {
          // hourly_price should only be set for private spots
          return this.spot_type === "private";
        },
        message: "Hourly price can only be set for private parking spots",
      },
      min: [0, "Hourly price cannot be negative"],
    },

    // Availability schedule - available for both spot types
    availability_schedule: {
      type: [availabilityScheduleSchema],
      default: [], // Default to empty array, making it optional
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    // Fields for storing images of the parking spot
    photos: [String],
    address: {
      city: {
        type: String,
        required: function () {
          return this.spot_type === "private";
        },
      },
      street: {
        type: String,
        required: function () {
          return this.spot_type === "private";
        },
      },
      number: {
        type: Number,
        required: function () {
          return this.spot_type === "private";
        },
      },
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create appropriate indexes
parkingSpotSchema.index(
  { building: 1, spot_number: 1, floor: 1 },
  {
    unique: true,
    partialFilterExpression: { spot_type: "building" },
  }
);

// Middleware to update the "updated_at" field on document updates
parkingSpotSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.updated_at = Date.now();
  }

  // If spot type is not private, reset private-specific fields
  if (this.spot_type !== "private") {
    this.hourly_price = undefined;

    // Only reset charging station info if it's a building spot
    if (this.spot_type === "building") {
      this.is_charging_station = false;
      this.charger_type = null;
    }
  }

  next();
});

parkingSpotSchema.pre("save", async function (next) {
  // Update the 'updated_at' field on document updates
  if (!this.isNew) {
    this.updated_at = Date.now();
  }

  // Only update coordinates if this is a private spot and the address was modified
  if (
    this.spot_type === "private" &&
    this.address &&
    (this.isModified("address.city") ||
      this.isModified("address.street") ||
      this.isModified("address.number"))
  ) {
    try {
      // Only geocode if we have the minimum required address information
      if (this.address.city && this.address.street) {
        const geocodeResult = await geocoder.geocode({
          city: this.address.city,
          street: this.address.street,
          number: this.address.number || "",
        });

        if (geocodeResult.success) {
          this.address.latitude = geocodeResult.latitude;
          this.address.longitude = geocodeResult.longitude;
          console.log(
            `Updated coordinates for spot ${this._id}: [${geocodeResult.latitude}, ${geocodeResult.longitude}]`
          );
        } else {
          console.log(
            `Failed to geocode address for spot ${this._id}: ${geocodeResult.message}`
          );
        }
      }
    } catch (error) {
      console.error(`Error geocoding for spot ${this._id}:`, error);
      // Don't block the save operation if geocoding fails
    }
  }

  // If spot type is not private, reset private-specific fields
  if (this.spot_type !== "private") {
    this.hourly_price = undefined;

    // Only reset charging station info if it's a building spot
    if (this.spot_type === "building") {
      this.is_charging_station = false;
      this.charger_type = null;
    }
  }

  next();
});

// Middleware to validate the owner field
parkingSpotSchema.pre("validate", async function (next) {
  if (!this.owner) {
    return next(new Error("Owner is required for all parking spots"));
  }

  // Reset fields based on spot_type
  if (this.spot_type !== "private") {
    this.hourly_price = undefined;

    if (this.spot_type === "building") {
      this.is_charging_station = false;
      this.charger_type = null;
    }
  }

  next();
});

// Improve validation for charger_type
parkingSpotSchema.path("charger_type").validate(function (val) {
  if (this.is_charging_station && !val) {
    throw new Error("Charger type is required for charging stations");
  }
  return true;
});

// Create a virtual property to check if a spot is occupied
parkingSpotSchema.virtual("is_occupied").get(function () {
  return !!this.user;
});

// Add a virtual property to expose hourly_price only for private spots
parkingSpotSchema.virtual("effective_hourly_price").get(function () {
  return this.spot_type === "private" ? this.hourly_price : null;
});

parkingSpotSchema.index({
  'availability_schedule.is_available': 1,
  'availability_schedule.start_datetime': 1,
  'availability_schedule.end_datetime': 1,
  'availability_schedule.type': 1 // If type is often a filter
});

const ParkingSpot = mongoose.model("ParkingSpot", parkingSpotSchema);
module.exports = ParkingSpot;
