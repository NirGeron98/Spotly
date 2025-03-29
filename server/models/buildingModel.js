const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema({
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  city: { type: String, required: true },
  street: { type: String, required: true },
  building_number: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  code: { type: String, required: true },

  residents: [
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      //parking_spot: { type: mongoose.Schema.Types.ObjectId, ref: 'BuildingParkingSpot' }
    },
  ],
});

const Building = mongoose.model("Building", buildingSchema);
module.exports = Building;
