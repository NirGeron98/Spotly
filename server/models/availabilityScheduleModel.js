const mongoose = require("mongoose");

const availabilityScheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    start_time: {
      type: String, // Format: "HH:MM" in 24-hour format
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Use HH:MM in 24-hour format.`,
      },
    },
    end_time: {
      type: String, // Format: "HH:MM" in 24-hour format
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Use HH:MM in 24-hour format.`,
      },
    },
    is_available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

module.exports = availabilityScheduleSchema;
