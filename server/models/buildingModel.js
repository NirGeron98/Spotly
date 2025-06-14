const mongoose = require("mongoose");
const Counter = require("./utils/counterModel");

const buildingSchema = new mongoose.Schema({
  building_number: {
    type: String,
    unique: true,
    index: true,
  },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  address: {
    city: { type: String, required: true },
    street: { type: String, required: true },
    number: { type: Number, required: true },
  },
  created_at: { type: Date, default: Date.now },

  residents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: function (value) {
          // Ensure that the resident is not already in the list
          return !this.residents || !this.residents.includes(value);
        },
        message: "Resident already exists in this building",
      },
    },
  ],
});

// Pre-save middleware to generate and assign serial number
buildingSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next(); // Only generate serial for new buildings
  }

  try {
    // Find and update the counter document, or create it if not exists
    const counter = await Counter.findByIdAndUpdate(
      { _id: "buildingId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Format the serial number with leading zeros (e.g., BLD-00001)
    this.building_number = `BLD-${counter.seq.toString()}`;
    next();
  } catch (error) {
    return next(error);
  }
});

const Building = mongoose.model("Building", buildingSchema);
module.exports = Building;