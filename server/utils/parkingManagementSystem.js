// parkingManagerMongoose.js

// *** Assuming 'interval-tree2' refers to the library matching YOUR snippet ***
// Requires 'interval-tree2' but uses the API shown in your documentation
const IntervalTree = require('interval-tree2'); // <<<< Assuming this is the correct require for YOUR library version
const mongoose = require('mongoose');

// Helper function (remains the same)
function combineDateTime(dateOnly, timeString) {
  if (!dateOnly || !timeString || typeof timeString !== 'string') {
    return null;
  }
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return null;
  }
  const combined = new Date(dateOnly);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

class ParkingManagementSystem {
  /**
   * Manages parking availability using Mongoose models and the interval-tree library
   * matching the provided documentation (constructor with center).
   * @param {object} models - Object containing Mongoose models.
   * @param {mongoose.Model} models.ParkingSpot - The ParkingSpot model.
   * @param {mongoose.Model} models.Booking - The Booking model.
   */
  constructor(models) {
    if (!models || !models.ParkingSpot || !models.Booking) {
      throw new Error('Mongoose models (ParkingSpot, Booking) are required!');
    }
    this.ParkingSpot = models.ParkingSpot;
    this.Booking = models.Booking;

    // *** Constructor matching YOUR documentation: Requires a 'center' ***
    this.treeCenter = 0; // Or Date.now().getTime(); Choose a suitable center.
    this.availabilityTree = new IntervalTree(this.treeCenter);

    this.isLoaded = false;
    // Required because this tree API only stores ID with the interval
    this.intervalDataStore = new Map(); // Maps intervalId -> { spotId, scheduleId }
  }

  /**
   * Loads current and future availability from the database into the tree.
   */
  async loadFromDatabase() {
    console.log(
      'Loading availability data from MongoDB using tree API (with center)...',
    );
    // *** Constructor matching YOUR documentation ***
    this.availabilityTree = new IntervalTree(this.treeCenter);
    this.intervalDataStore = new Map(); // Reset map
    let loadedCount = 0;
    this.isLoaded = false;

    try {
      const now = new Date();
      const spots = await this.ParkingSpot.find({
        'availability_schedule.0': { $exists: true },
      }).exec();

      for (const spot of spots) {
        if (
          !spot.availability_schedule ||
          spot.availability_schedule.length === 0
        )
          continue;

        for (const scheduleEntry of spot.availability_schedule) {
          const endDateTime = combineDateTime(
            scheduleEntry.date,
            scheduleEntry.end_time,
          );
          if (scheduleEntry.is_available && endDateTime && endDateTime > now) {
            const startDateTime = combineDateTime(
              scheduleEntry.date,
              scheduleEntry.start_time,
            );
            if (startDateTime && startDateTime < endDateTime) {
              // *** Use scheduleId as the interval ID for the tree ***
              const intervalId = scheduleEntry._id.toString();
              const intervalData = {
                spotId: spot._id.toString(),
                scheduleId: intervalId,
              };

              // *** Use .add() method matching YOUR documentation ***
              this.availabilityTree.add(
                startDateTime.getTime(),
                endDateTime.getTime(),
                intervalId, // Use scheduleId as the tree's interval ID
              );
              // Store the actual data associated with this interval ID
              this.intervalDataStore.set(intervalId, intervalData);

              loadedCount++;
            }
          }
        }
      }
      this.isLoaded = true;
      console.log(`Successfully loaded ${loadedCount} active intervals.`);
    } catch (err) {
      console.error('ERROR loading data from MongoDB:', err);
      this.isLoaded = false;
      throw err;
    }
  }

  /**
   * Adds an availability entry.
   */
  async addAvailability(
    spotIdString,
    date,
    startTimeStr,
    endTimeStr,
    options = {},
  ) {
    if (!this.isLoaded) throw new Error('System not loaded from database yet.');
    try {
      const startDateTime = combineDateTime(date, startTimeStr);
      const endDateTime = combineDateTime(date, endTimeStr);
      if (!startDateTime || !endDateTime || startDateTime >= endDateTime)
        return false;

      const spot = await this.ParkingSpot.findById(spotIdString);
      if (!spot) return false;

      const newScheduleEntry = {
        /* ... fill details ... */
      };
      newScheduleEntry.date = date;
      newScheduleEntry.start_time = startTimeStr;
      newScheduleEntry.end_time = endTimeStr;
      newScheduleEntry.is_available = true;
      newScheduleEntry.type = options.type || 'השכרה רגילה';
      newScheduleEntry.charger = options.charger;

      spot.availability_schedule.push(newScheduleEntry);
      await spot.save();

      const addedSubDoc =
        spot.availability_schedule[spot.availability_schedule.length - 1];
      const intervalId = addedSubDoc._id.toString();
      const intervalData = {
        spotId: spot._id.toString(),
        scheduleId: intervalId,
      };

      // *** Use .add() method matching YOUR documentation ***
      this.availabilityTree.add(
        startDateTime.getTime(),
        endDateTime.getTime(),
        intervalId,
      );
      this.intervalDataStore.set(intervalId, intervalData);

      console.log(
        `INFO: Added availability: Spot ${spotIdString}, Schedule/Interval ${intervalId}`,
      );
      return true;
    } catch (e) {
      console.error(`ERROR adding availability: ${e.message}`, e);
      return false;
    }
  }

  /**
   * Removes a specific availability entry using its schedule ID.
   */
  async removeAvailability(spotIdString, scheduleIdString) {
    if (!this.isLoaded) throw new Error('System not loaded from database yet.');
    try {
      // The interval ID used in the tree *is* the schedule ID
      const intervalIdToRemove = scheduleIdString;

      // 1. Remove from DB first
      const updateResult = await this.ParkingSpot.updateOne(
        { _id: spotIdString },
        { $pull: { availability_schedule: { _id: scheduleIdString } } },
      );

      if (updateResult.modifiedCount === 0) {
        console.warn(
          `WARN: DB remove command didn't modify spot ${spotIdString} for schedule ${scheduleIdString}.`,
        );
      }

      // 2. Remove from Tree and Data Store
      // *** Use .remove(id) method matching YOUR documentation ***
      const treeRemoved = this.availabilityTree.remove(intervalIdToRemove);
      const dataRemoved = this.intervalDataStore.delete(intervalIdToRemove);

      if (!treeRemoved) {
        console.warn(
          `WARN: Interval ${intervalIdToRemove} not found in tree for removal.`,
        );
      }
      if (!dataRemoved) {
        console.warn(
          `WARN: Data for interval ${intervalIdToRemove} not found in data store.`,
        );
      }

      // Consistency checks...
      if (updateResult.modifiedCount > 0 && !treeRemoved) {
        console.error(
          `CRITICAL INCONSISTENCY: Schedule ${scheduleIdString} removed from DB but interval ${intervalIdToRemove} NOT found/removed in memory tree!`,
        );
      } else if (updateResult.modifiedCount === 0 && treeRemoved) {
        console.warn(
          `INCONSISTENCY: Schedule ${scheduleIdString} not removed from DB but interval ${intervalIdToRemove} was removed from memory tree.`,
        );
      }

      console.log(
        `INFO: Removed availability: Spot ${spotIdString}, Schedule/Interval ${intervalIdToRemove}`,
      );
      return updateResult.modifiedCount > 0;
    } catch (e) {
      console.error(`ERROR removing availability: ${e.message}`, e);
      return false;
    }
  }

  /**
   * Allocates a spot.
   */
  async allocateSpot(requestStartTime, requestEndTime, userId, options = {}) {
    if (!this.isLoaded) throw new Error('System not loaded from database yet.');

    const reqStart = requestStartTime;
    const reqEnd = requestEndTime;
    const reqStartMs = reqStart.getTime();
    const reqEndMs = reqEnd.getTime();

    if (reqStartMs >= reqEndMs || !userId) return null;

    console.log(
      `\n---> Request received for user ${userId}: ${reqStart.toISOString()} to ${reqEnd.toISOString()}`,
    );

    // 1. Find Overlapping Intervals
    // *** Use .search() and expect results {start, end, id} matching YOUR documentation ***
    const overlappingIntervalObjects = this.availabilityTree.search(
      reqStartMs,
      reqEndMs,
    );

    // 2. Filter for Containing Intervals & Retrieve Associated Data
    const candidateIntervals = [];
    for (const intervalObj of overlappingIntervalObjects) {
      // intervalObj has .start, .end, .id
      if (intervalObj.start <= reqStartMs && intervalObj.end >= reqEndMs) {
        const intervalData = this.intervalDataStore.get(intervalObj.id);
        if (intervalData) {
          candidateIntervals.push({
            start: intervalObj.start,
            end: intervalObj.end,
            id: intervalObj.id, // This is the scheduleId
            data: intervalData, // { spotId, scheduleId }
          });
        } else {
          console.warn(`WARN: Data missing for interval ID ${intervalObj.id}`);
        }
      }
    }

    if (candidateIntervals.length === 0) {
      console.log(
        '--- Allocation Failed: No available spot fully contains the requested time.',
      );
      return null;
    }

    // 3. Calculate Best Fit
    let bestFitCandidate = null;
    let minFitScore = Infinity;
    for (const candidate of candidateIntervals) {
      const fitScore =
        reqStartMs - candidate.start + (candidate.end - reqEndMs);
      console.log(
        `  - Candidate: Spot ${candidate.data.spotId}, Schedule ${candidate.id}, Fit Score: ${fitScore} ms`,
      );
      if (fitScore >= 0 && fitScore < minFitScore) {
        minFitScore = fitScore;
        bestFitCandidate = candidate;
      }
    }

    if (!bestFitCandidate) return null; // Should not happen

    const bestFitStartMs = bestFitCandidate.start;
    const bestFitEndMs = bestFitCandidate.end;
    const originalIntervalId = bestFitCandidate.id; // This IS the originalScheduleId
    const { spotId: allocatedSpotId } = bestFitCandidate.data;

    console.log(
      `Selected Best Fit: Spot ${allocatedSpotId}, Schedule/Interval ${originalIntervalId}`,
    );

    // --- Transaction for DB Operations ---
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Mongoose logic (verify entry, create booking, pull original, push splits)
      // remains the same as the previous version, using originalIntervalId as the scheduleId.
      const spot =
        await this.ParkingSpot.findById(allocatedSpotId).session(session);
      if (!spot) throw new Error(`Spot ${allocatedSpotId} not found.`);
      const originalScheduleEntry =
        spot.availability_schedule.id(originalIntervalId);
      if (!originalScheduleEntry || !originalScheduleEntry.is_available)
        throw new Error(`Original schedule ${originalIntervalId} unavailable.`);

      const bookingData = {
        /* ... booking details using originalIntervalId ... */
      };
      bookingData.user = userId;
      bookingData.booking_type = options.booking_type || 'parking';
      bookingData.spot = allocatedSpotId;
      bookingData.start_datetime = reqStart;
      bookingData.end_datetime = reqEnd;
      bookingData.status = 'active';
      bookingData.base_rate = spot.hourly_price || 0;
      bookingData.payment_status = 'pending';
      bookingData.schedule = originalIntervalId; // Link to the schedule

      const newBooking = new this.Booking(bookingData);
      await newBooking.save({ session });

      const updates = []; // Array for new schedule entries (splits)
      // Create prefix/suffix objects (logic is same)
      if (bestFitStartMs < reqStartMs) {
        /* create prefix object */
        const prefixEndTimeStr = `${reqStart.getHours().toString().padStart(2, '0')}:${reqStart.getMinutes().toString().padStart(2, '0')}`;
        updates.push({
          date: originalScheduleEntry.date,
          start_time: originalScheduleEntry.start_time,
          end_time: prefixEndTimeStr,
          is_available: true,
          type: originalScheduleEntry.type,
          charger: originalScheduleEntry.charger,
        });
      }
      if (reqEndMs < bestFitEndMs) {
        /* create suffix object */
        const suffixStartTimeStr = `${reqEnd.getHours().toString().padStart(2, '0')}:${reqEnd.getMinutes().toString().padStart(2, '0')}`;
        updates.push({
          date: originalScheduleEntry.date,
          start_time: suffixStartTimeStr,
          end_time: originalScheduleEntry.end_time,
          is_available: true,
          type: originalScheduleEntry.type,
          charger: originalScheduleEntry.charger,
        });
      }

      // Perform DB pull/push (logic is same)
      const pullResult = await this.ParkingSpot.updateOne(
        { _id: allocatedSpotId },
        { $pull: { availability_schedule: { _id: originalIntervalId } } },
        { session },
      );
      if (pullResult.modifiedCount === 0)
        throw new Error(
          `Failed to pull original schedule ${originalIntervalId}.`,
        );

      let pushedScheduleEntries = [];
      if (updates.length > 0) {
        await this.ParkingSpot.updateOne(
          { _id: allocatedSpotId },
          { $push: { availability_schedule: { $each: updates } } },
          { session },
        );
        const updatedSpot = await this.ParkingSpot.findById(allocatedSpotId)
          .select('availability_schedule')
          .session(session); // Re-fetch needed for new IDs
        pushedScheduleEntries = updatedSpot.availability_schedule.slice(
          -updates.length,
        );
      }

      await session.commitTransaction();

      // Update In-Memory Tree
      // a) Remove original
      // *** Use .remove(id) method matching YOUR documentation ***
      const treeRemoved = this.availabilityTree.remove(originalIntervalId);
      if (!treeRemoved)
        console.error(
          `CRITICAL INCONSISTENCY: Failed to remove committed interval ${originalIntervalId} from memory tree!`,
        );
      this.intervalDataStore.delete(originalIntervalId); // Clean up data store

      // b) Add splits back to tree
      if (pushedScheduleEntries.length > 0) {
        console.log(
          `Adding ${pushedScheduleEntries.length} split interval(s) back to memory tree...`,
        );
        for (const newEntry of pushedScheduleEntries) {
          const startDt = combineDateTime(newEntry.date, newEntry.start_time);
          const endDt = combineDateTime(newEntry.date, newEntry.end_time);
          const newIntervalId = newEntry._id.toString(); // Get the NEW schedule ID
          if (startDt && endDt && startDt < endDt) {
            const newIntervalData = {
              spotId: allocatedSpotId,
              scheduleId: newIntervalId,
            };
            // *** Use .add() method matching YOUR documentation ***
            this.availabilityTree.add(
              startDt.getTime(),
              endDt.getTime(),
              newIntervalId,
            );
            this.intervalDataStore.set(newIntervalId, newIntervalData);
          }
        }
      }

      console.log(
        `--- Allocation SUCCESSFUL (DB & Memory): Booking ${newBooking._id} created for Spot ${allocatedSpotId}`,
      );
      return newBooking.toObject();
    } catch (error) {
      console.error(
        `ERROR during allocation transaction: ${error.message}. Rolling back.`,
      );
      await session.abortTransaction();
      return null;
    } finally {
      session.endSession();
    }
  }

  printAvailability() {
    console.log(
      '\n--- Current Availability (In Memory using API from your snippet) ---',
    );
    // *** Use .search() and result format matching YOUR documentation ***
    const allIntervalObjects = this.availabilityTree.search(
      -Infinity,
      Infinity,
    );

    if (allIntervalObjects.length === 0) {
      console.log('No spots currently available in memory tree.');
    } else {
      allIntervalObjects.sort((a, b) => a.start - b.start); // Sort by start time
      allIntervalObjects.forEach((intervalObj) => {
        const data = this.intervalDataStore.get(intervalObj.id); // Get associated data
        if (data) {
          console.log(
            `Spot ${data.spotId}, Schedule/Interval ${intervalObj.id}: [${new Date(intervalObj.start).toISOString()}, ${new Date(intervalObj.end).toISOString()})`,
          );
        } else {
          console.log(
            `Interval ID ${intervalObj.id}: [${new Date(intervalObj.start).toISOString()}, ${new Date(intervalObj.end).toISOString()}) - Data Missing!`,
          );
        }
      });
    }
    console.log(`Total intervals in memory: ${allIntervalObjects.length}`);
    console.log(`Total data entries stored: ${this.intervalDataStore.size}`);
    console.log('--------------------------');
  }
}

module.exports = ParkingManagementSystem;
