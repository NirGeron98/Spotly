// parkingManagerMongoose.js

const mongoose = require('mongoose');
const IntervalTree = require('interval-tree2');

class ParkingManagementSystem {
  constructor(models) {
    if (!models || !models.ParkingSpot || !models.Booking) {
      throw new Error('Mongoose models (ParkingSpot, Booking) are required!');
    }
    this.ParkingSpot = models.ParkingSpot;
    this.Booking = models.Booking;
    this.treeCenter = 0;
    this.availabilityTree = new IntervalTree(this.treeCenter);
    this.intervalDataStore = new Map();
    this.isLoaded = false;
  }

  async loadFromDatabase() {
    console.log(
      'Loading availability data from MongoDB (using start_datetime/end_datetime fields)...',
    );
    this.availabilityTree = new IntervalTree(this.treeCenter); // Re-initialize
    this.intervalDataStore = new Map(); // Reset map
    let loadedCount = 0;
    this.isLoaded = false;

    try {
      const now = new Date();
      const spots = await this.ParkingSpot.find({
        'availability_schedule.0': { $exists: true }, // Find spots with at least one schedule
      }).exec();

      for (const spot of spots) {
        if (
          !spot.availability_schedule ||
          spot.availability_schedule.length === 0
        )
          continue;

        for (const scheduleEntry of spot.availability_schedule) {
          // Directly use Date objects from the schedule
          const startDateTime = scheduleEntry.start_datetime; // This is already a Date object
          const endDateTime = scheduleEntry.end_datetime; // This is already a Date object

          if (
            scheduleEntry.is_available &&
            startDateTime instanceof Date &&
            !isNaN(startDateTime) && // Ensure it's a valid Date
            endDateTime instanceof Date &&
            !isNaN(endDateTime) && // Ensure it's a valid Date
            endDateTime > now && // only load future/current available slots
            startDateTime < endDateTime // ensure start is before end
          ) {
            const intervalId = scheduleEntry._id.toString();
            const intervalData = {
              spotId: spot._id.toString(),
              scheduleId: intervalId,
            };

            this.availabilityTree.add(
              startDateTime.getTime(),
              endDateTime.getTime(),
              intervalId,
            );
            this.intervalDataStore.set(intervalId, intervalData);
            loadedCount++;
          }
        }
      }
      this.isLoaded = true;
      console.log(
        `Successfully loaded ${loadedCount} active intervals into tree.`,
      );
    } catch (err) {
      console.error('ERROR loading data from MongoDB into interval tree:', err);
      this.isLoaded = false;
      throw err;
    }
  }

  async createBookingAndSplitAvailability(
    spotId,
    requestedBookingStart, // This is a Date object from controller
    requestedBookingEnd, // This is a Date object from controller
    userId,
    bookingDetails = {},
  ) {
    if (!this.isLoaded) {
      console.error(
        'ParkingManagementSystem: System not loaded from database yet.',
      );
      throw new Error(
        'System temporarily unavailable, please try again shortly.',
      );
    }
    if (requestedBookingEnd <= requestedBookingStart) {
      throw new Error('Booking end time must be after start time.');
    }

    const session = await mongoose.startSession();
    let createdBooking = null;

    try {
      await session.withTransaction(async (sess) => {
        const spot = await this.ParkingSpot.findById(spotId).session(sess);
        if (!spot) {
          throw new Error('Parking spot not found.');
        }

        let matchedDbSchedule = null;
        let matchedDbScheduleIndex = -1;

        // Find the DB availability schedule that fully contains the booking time
        for (let i = 0; i < spot.availability_schedule.length; i++) {
          const dbSchedule = spot.availability_schedule[i];
          // Directly compare Date objects
          if (
            dbSchedule.is_available === true &&
            dbSchedule.start_datetime instanceof Date && // Ensure valid Date
            dbSchedule.end_datetime instanceof Date && // Ensure valid Date
            dbSchedule.start_datetime <= requestedBookingStart &&
            dbSchedule.end_datetime >= requestedBookingEnd
          ) {
            matchedDbSchedule = dbSchedule;
            matchedDbScheduleIndex = i;
            break;
          }
        }

        if (!matchedDbSchedule) {
          throw new Error(
            'No available schedule fully contains the requested booking time for this spot.',
          );
        }

        const originalScheduleId = matchedDbSchedule._id.toString();

        const newDbAvailabilitySchedules = [];

        // 1. Create new DB schedule for time BEFORE booking (prefix)
        if (matchedDbSchedule.start_datetime < requestedBookingStart) {
          newDbAvailabilitySchedules.push({
            _id: new mongoose.Types.ObjectId(),
            start_datetime: matchedDbSchedule.start_datetime, // Original start
            end_datetime: requestedBookingStart, // Booking start is new end
            is_available: true,
            type: matchedDbSchedule.type,
            charger: matchedDbSchedule.charger,
          });
        }

        // 2. Create new DB schedule for time AFTER booking (suffix)
        if (matchedDbSchedule.end_datetime > requestedBookingEnd) {
          newDbAvailabilitySchedules.push({
            _id: new mongoose.Types.ObjectId(),
            start_datetime: requestedBookingEnd, // Booking end is new start
            end_datetime: matchedDbSchedule.end_datetime, // Original end
            is_available: true,
            type: matchedDbSchedule.type,
            charger: matchedDbSchedule.charger,
          });
        }

        // Update ParkingSpot in DB: Pull old schedule, push new ones
        spot.availability_schedule.splice(matchedDbScheduleIndex, 1); // Remove old
        if (newDbAvailabilitySchedules.length > 0) {
          spot.availability_schedule.push(...newDbAvailabilitySchedules); // Add new
        }
        await spot.save({ session: sess });

        // 3. Create the Booking record
        const bookingPayload = {
          ...bookingDetails,
          user: userId,
          spot: spot._id,
          start_datetime: requestedBookingStart,
          end_datetime: requestedBookingEnd,
          base_rate: bookingDetails.base_rate || spot.hourly_price || 0,
          status: 'active',
          payment_status: 'pending',
          schedule: null,
        };
        const bookingsCreated = await this.Booking.create([bookingPayload], {
          session: sess,
        });
        createdBooking = bookingsCreated[0];

        // --- Update In-Memory Interval Tree ---
        const treeRemoved = this.availabilityTree.remove(originalScheduleId);
        if (!treeRemoved) {
          console.error(
            `CRITICAL INCONSISTENCY: Failed to remove interval ${originalScheduleId} (DB schedule ${matchedDbSchedule._id}) from memory tree during booking. It was expected to be there.`,
          );
        }
        this.intervalDataStore.delete(originalScheduleId);

        for (const newSched of newDbAvailabilitySchedules) {
          const newIntervalId = newSched._id.toString();
          if (
            newSched.start_datetime instanceof Date &&
            newSched.end_datetime instanceof Date &&
            newSched.start_datetime < newSched.end_datetime
          ) {
            this.availabilityTree.add(
              newSched.start_datetime.getTime(),
              newSched.end_datetime.getTime(),
              newIntervalId,
            );
            this.intervalDataStore.set(newIntervalId, {
              spotId: spot._id.toString(),
              scheduleId: newIntervalId,
            });
          } else {
            console.warn(
              `Skipping invalid new schedule for tree: ${newIntervalId}`,
            );
          }
        }
      }); // End of session.withTransaction

      console.log(
        `Booking ${createdBooking?._id} created successfully for spot ${spotId}. DB and tree updated.`,
      );
      return createdBooking ? createdBooking.toObject() : null;
    } catch (error) {
      console.error(
        `Error in createBookingAndSplitAvailability for spot ${spotId}:`,
        error,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = ParkingManagementSystem;
