const mongoose = require("mongoose");
const munkres = require("munkres-js");
const ParkingRequest = require("../models/parkingRequestModel");
const ParkingSpot = require("../models/parkingSpotModel");
const { updateUserScore, SCORING_EVENTS } = require("./scoringService");
const bookingService = require("./bookingService");

/**
 * Runs the batch allocation process for requests starting on a given target date.
 */
async function runBatchAllocation(targetDate) {

  const startOfTargetDate = new Date(targetDate);
  startOfTargetDate.setHours(0, 0, 0, 0);
  const endOfTargetDate = new Date(targetDate);
  endOfTargetDate.setHours(23, 59, 59, 999);

  // 1. Fetch all pending requests that START on the target date
  const requests = await ParkingRequest.find({
    status: "pending_batch",
    start_datetime: { $gte: startOfTargetDate, $lte: endOfTargetDate },
  }).populate("userId", "priority_score timezone"); // Populate user data

  // 2. Fetch ALL building spots once to work with them in memory
  const allBuildingSpots = await ParkingSpot.find({ spot_type: "building" });

  if (allBuildingSpots.length === 0) {
    // If there are no building spots, move all requests to the waiting queue.
    await ParkingRequest.updateMany(
      { _id: { $in: requests.map((r) => r._id) } },
      { $set: { status: "waiting_queue" } }
    );
    return console.log(
      "No building spots found. All pending requests moved to waiting queue."
    );
  }

  // 3. Build the Cost Matrix by checking eligibility for EACH request/spot pair
  const costMatrix = requests.map((request) => {
    return allBuildingSpots.map((spot) => {
      // Check if this specific spot is available for this specific request's time window
      const isSpotAvailable = spot.availability_schedule.some(
        (slot) =>
          slot.is_available &&
          new Date(slot.start_datetime) <= new Date(request.start_datetime) &&
          new Date(slot.end_datetime) >= new Date(request.end_datetime)
      );

      if (isSpotAvailable) {
        const userScore = request.userId ? request.userId.priority_score : 0;
        return 1000 - userScore; // Real cost for possible assignment
      } else {
        return Number.MAX_SAFE_INTEGER; // "Infinite" cost for impossible assignment
      }
    });
  });

  // 4. Run the Hungarian Algorithm
  const assignments = munkres(costMatrix);

  // 5. Process the results, one by one, each in its own transaction
  const confirmedRequestIds = new Set();
  for (const [requestIndex, spotIndex] of assignments) {
    // Check if the assignment is valid (not one of our "infinite" cost assignments)
    if (costMatrix[requestIndex][spotIndex] >= Number.MAX_SAFE_INTEGER) {
      continue;
    }

    const request = requests[requestIndex];
    const spot = allBuildingSpots[spotIndex];

    // This session will manage the entire atomic operation for this one assignment
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // OPERATION 1: Create the booking, passing the session to join our transaction
      await bookingService.createBooking(
        request.userId._id,
        spot._id,
        request.start_datetime,
        request.end_datetime,
        {
          /* Pass any required booking details here */
        },
        request.userId.timezone || "UTC",
        { session } // This is the key part
      );

      // OPERATION 2: Update the request status using the same session
      request.status = "confirmed";
      request.assignedSpotId = spot._id;
      await request.save({ session });
      confirmedRequestIds.add(request._id.toString());

      // OPERATION 3: Update the user's score using the same session
      await updateUserScore(request.userId._id, "SUCCESSFUL_ADVANCE_BOOKING", {
        session,
      });

      // If all three operations succeed, commit the single transaction
      await session.commitTransaction();
      // TODO: Notify user they got a spot.
    } catch (error) {
      // If any operation fails, the entire transaction is rolled back
      await session.abortTransaction();
      console.error(
        `TRANSACTION ROLLED BACK for request ${request._id}. No changes were made to the database. Error: ${error.message}`
      );
    } finally {
      // Always end the session we created
      session.endSession();
    }
  }

  // 6. Move any remaining unassigned requests to the 'waiting_queue'
  for (const request of requests) {
    if (!confirmedRequestIds.has(request._id.toString())) {
      request.status = "waiting_queue";
      await request.save(); // This can be a simple save, no transaction needed
      // TODO: Notify user they are on the waitlist.
    }
  }
}

module.exports = { runBatchAllocation };
