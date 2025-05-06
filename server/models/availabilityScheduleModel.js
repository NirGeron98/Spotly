const mongoose = require("mongoose");

const availabilityScheduleSchema = new mongoose.Schema(
  {
    start_datetime: {
      type: Date,
      required: [true, "An availability slot must have a start date and time."],
    },  
    end_datetime: {
      type: Date,
      required: [true, "An availability slot must have an end date and time."],
      validate: [
        function (val) {
          // 'this' points to the current document being validated
          return val > this.start_datetime;
        },
        "End time must be after start time.",
      ],
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["השכרה רגילה", "טעינה לרכב חשמלי"],
      default: "השכרה רגילה",
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null, // Null if the schedule (or part of it) is not booked
    },
  },
  { _id: true }
);

module.exports = availabilityScheduleSchema;
