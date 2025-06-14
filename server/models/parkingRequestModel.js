const mongoose = require('mongoose');

const parkingRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A parking request must belong to a user.'],
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'A parking request must be for a specific building.'],
    },
    start_datetime: {
      type: Date,
      required: [true, 'A request must have a start datetime.'],
    },
    end_datetime: {
      type: Date,
      required: [true, 'A request must have an end datetime.'],
    },
    /**
     * - pending_batch: Waiting for the nightly job.
     * - waiting_queue: Not fulfilled by batch or an immediate request, now on the waitlist.
     * - confirmed: A spot has been successfully assigned.
     * - cancelled: The user cancelled the request.
     */
    status: {
      type: String,
      enum: ['pending_batch', 'waiting_queue', 'confirmed', 'cancelled'],
      default: 'pending_batch',
    },
    assignedSpotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * The batch job will query for requests that start on a given day.
 * An index on `start_datetime` and `status` will make this very fast.
 */
parkingRequestSchema.index({ start_datetime: 1, status: 1 });

const ParkingRequest = mongoose.model('ParkingRequest', parkingRequestSchema);

module.exports = ParkingRequest;