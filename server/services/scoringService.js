const User = require("../models/userModel");

/**
 * A centralized map of events to score changes.
 * This makes it easy to adjust the scoring values later without changing the function logic.
 */
const SCORING_EVENTS = {
  SUCCESSFUL_ADVANCE_BOOKING: 2,
  CANCELLED_IN_ADVANCE: 1,
  LAST_MINUTE_CANCELLATION: -5,
  NO_SHOW: -15,
};

/**
 * Updates a user's priority_score based on a predefined event.
 * @param {string} userId - The ID of the user to update.
 * @param {string} event - The key of the event from SCORING_EVENTS.
 */
async function updateUserScore(userId, event, options = {}) {
  const { session } = options;

  if (!SCORING_EVENTS[event]) {
    console.error(`Invalid scoring event provided: ${event}`);
    return;
  }
  const points = SCORING_EVENTS[event];
  try {
    await User.findByIdAndUpdate(
      userId,
      { $inc: { priority_score: points } },
      { session } // Use session if provided for transaction support
    );
    console.log(
      `User ${userId} score updated by ${points} points for event: ${event}.`
    );
  } catch (error) {
    console.error(`Failed to update score for user ${userId}:`, error);
  }
}

module.exports = {
  updateUserScore,
  SCORING_EVENTS,
};
