const mongoose = require("mongoose");

/**
 * Counter schema for generating sequential IDs
 * Used by various models that need auto-incrementing identifiers
 */
const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
