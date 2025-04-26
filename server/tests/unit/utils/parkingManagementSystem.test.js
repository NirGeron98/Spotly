// server/tests/unit/utils/parkingManagementSystem.test.js

const mongoose = require("mongoose");
const ParkingManagementSystem = require("../../../utils/parkingManagementSystem");
const IntervalTree = require("interval-tree2"); // Import for mocking if needed

// Mock Mongoose Models
const mockParkingSpotModel = {
  find: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
};
const mockBookingModel = jest.fn(); // Mock constructor
mockBookingModel.prototype.save = jest.fn(); // Mock save method on instances

// Mock Mongoose Session
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};
mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

// Helper to create mock spot objects
const createMockSpot = (id, schedules = []) => {
  // Ensure schedules have ObjectIds if they don't already
  const processedSchedules = schedules.map((s) => ({
    ...s,
    _id: s._id || new mongoose.Types.ObjectId(),
  }));

  return {
    _id: typeof id === "string" ? new mongoose.Types.ObjectId(id) : id,
    availability_schedule: {
      id: jest.fn((scheduleId) =>
        processedSchedules.find((s) => s._id.toString() === scheduleId)
      ),
      push: jest.fn((entry) => {
        const newEntry = { ...entry, _id: new mongoose.Types.ObjectId() };
        processedSchedules.push(newEntry);
        // Return the subdocument that Mongoose would return
        return newEntry;
      }),
      // Simulate Mongoose array behavior for finding the last element
      slice: jest.fn((start, end) => processedSchedules.slice(start, end)),
      get length() {
        return processedSchedules.length;
      }, // Use getter for dynamic length
      [Symbol.iterator]:
        processedSchedules[Symbol.iterator].bind(processedSchedules),
      // Allow direct access for tests if needed, though .id() is preferred
      find: jest.fn((callback) => processedSchedules.find(callback)),
    },
    save: jest.fn().mockResolvedValue(this),
    hourly_price: 10,
    toObject: jest.fn(() => ({
      _id: id,
      availability_schedule: processedSchedules,
      hourly_price: 10,
    })),
    // Add select and session methods for findById chaining in allocateSpot
    select: jest.fn().mockReturnThis(),
    session: jest.fn().mockResolvedValue(this), // Return the mock spot itself
  };
};

// Helper to create mock schedule entries
const createMockSchedule = (
  id,
  date,
  startTime,
  endTime,
  isAvailable = true
) => ({
  _id: new mongoose.Types.ObjectId(id),
  date: date,
  start_time: startTime,
  end_time: endTime,
  is_available: isAvailable,
  type: "השכרה רגילה",
  charger: null,
});

// Helper function to combine date and time (simplified for testing)
function combineDateTime(date, timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

describe("ParkingManagementSystem", () => {
  let pms;
  let models;
  // Mock IntervalTree methods used by PMS
  let mockTreeAdd;
  let mockTreeRemove;
  let mockTreeSearch;
  let mockIntervalTreeInstance;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockParkingSpotModel.find.mockClear();
    mockParkingSpotModel.findById.mockClear();
    mockParkingSpotModel.updateOne.mockClear();
    mockBookingModel.prototype.save.mockClear();
    mongoose.startSession.mockClear();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();

    // Mock IntervalTree constructor and methods
    mockTreeAdd = jest.fn();
    mockTreeRemove = jest.fn().mockReturnValue(true); // Assume removal succeeds by default
    mockTreeSearch = jest.fn().mockReturnValue([]); // Return empty array by default
    mockIntervalTreeInstance = {
      add: mockTreeAdd,
      remove: mockTreeRemove,
      search: mockTreeSearch,
    };
    jest.mock("interval-tree2", () => {
      return jest.fn().mockImplementation(() => mockIntervalTreeInstance);
    });
    const ParkingManagementSystem = require("../../../utils/parkingManagementSystem");

    models = {
      ParkingSpot: mockParkingSpotModel,
      Booking: mockBookingModel,
    };
    pms = new ParkingManagementSystem(models);
    pms.isLoaded = false; // Reset loaded state
    pms.intervalDataStore.clear(); // Clear the data store

    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should throw error if ParkingSpot model is missing", () => {
      expect(
        () => new ParkingManagementSystem({ Booking: mockBookingModel })
      ).toThrow("Mongoose models (ParkingSpot, Booking) are required!");
    });

    it("should throw error if Booking model is missing", () => {
      expect(
        () => new ParkingManagementSystem({ ParkingSpot: mockParkingSpotModel })
      ).toThrow("Mongoose models (ParkingSpot, Booking) are required!");
    });

    it("should initialize correctly with valid models", () => {
      expect(pms.ParkingSpot).toBe(mockParkingSpotModel);
      expect(pms.Booking).toBe(mockBookingModel);
      expect(pms.availabilityTree).toBeInstanceOf(IntervalTree);
      expect(pms.isLoaded).toBe(false);
    });
  });

  describe("loadFromDatabase", () => {
    it("should load active, future availability intervals into the tree and data store", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday

      const spot1Id = new mongoose.Types.ObjectId().toString();
      const schedule1Id = new mongoose.Types.ObjectId().toString();
      const schedule2Id = new mongoose.Types.ObjectId().toString(); // Past
      const schedule3Id = new mongoose.Types.ObjectId().toString(); // Not available
      const schedule4Id = new mongoose.Types.ObjectId().toString(); // Invalid times

      const mockSpots = [
        createMockSpot(spot1Id, [
          createMockSchedule(schedule1Id, futureDate, "09:00", "12:00", true), // Valid future
          createMockSchedule(schedule2Id, pastDate, "10:00", "11:00", true), // Past
          createMockSchedule(schedule3Id, futureDate, "13:00", "14:00", false), // Not available
          createMockSchedule(schedule4Id, futureDate, "16:00", "15:00", true), // Invalid start/end
        ]),
        createMockSpot(new mongoose.Types.ObjectId().toString(), []), // Spot with no schedule
      ];

      mockParkingSpotModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpots),
      });

      await pms.loadFromDatabase();

      expect(mockParkingSpotModel.find).toHaveBeenCalledWith({
        "availability_schedule.0": { $exists: true },
      });
      expect(pms.isLoaded).toBe(true);

      const expectedStart = combineDateTime(futureDate, "09:00").getTime();
      const expectedEnd = combineDateTime(futureDate, "12:00").getTime();

      // Check that tree.add was called correctly
      expect(mockTreeAdd).toHaveBeenCalledTimes(1); // Only one valid interval
      expect(mockTreeAdd).toHaveBeenCalledWith(
        expectedStart,
        expectedEnd,
        schedule1Id
      );

      // Check that intervalDataStore has the correct data
      expect(pms.intervalDataStore.size).toBe(1);
      expect(pms.intervalDataStore.get(schedule1Id)).toEqual({
        spotId: spot1Id,
        scheduleId: schedule1Id,
      });
    });

    it("should handle database errors during loading", async () => {
      const error = new Error("DB connection failed");
      mockParkingSpotModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(error),
      });

      await expect(pms.loadFromDatabase()).rejects.toThrow(
        "DB connection failed"
      );
      expect(pms.isLoaded).toBe(false);
      expect(mockTreeAdd).not.toHaveBeenCalled(); // Tree should not be added to
      expect(pms.intervalDataStore.size).toBe(0);
    });

    it("should handle spots with empty availability schedules", async () => {
      const spot1Id = new mongoose.Types.ObjectId().toString();
      const mockSpots = [createMockSpot(spot1Id, [])]; // Spot with empty schedule array

      mockParkingSpotModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpots),
      });

      await pms.loadFromDatabase();

      expect(pms.isLoaded).toBe(true);
      expect(mockTreeAdd).not.toHaveBeenCalled();
      expect(pms.intervalDataStore.size).toBe(0);
    });
  });

  describe("addAvailability", () => {
    const spotId = new mongoose.Types.ObjectId().toString();
    const testDate = new Date(2025, 5, 15); // June 15, 2025
    const startTimeStr = "10:00";
    const endTimeStr = "12:00";
    let mockSpot;
    let addedScheduleId; // To store the ID generated by mock push

    beforeEach(() => {
      // Reset mockSpot for each test in this block
      mockSpot = createMockSpot(spotId, []);
      // Modify the mock push to capture the generated ID
      mockSpot.availability_schedule.push.mockImplementation((entry) => {
        const newEntry = { ...entry, _id: new mongoose.Types.ObjectId() };
        // Directly modify the array backing the mock getter/iterator
        mockSpot.toObject().availability_schedule.push(newEntry);
        addedScheduleId = newEntry._id.toString(); // Capture the ID
        return newEntry; // Return the subdocument
      });
      mockParkingSpotModel.findById.mockResolvedValue(mockSpot);
      pms.isLoaded = true; // Assume loaded for these tests
    });

    it("should throw error if system is not loaded", async () => {
      pms.isLoaded = false;
      await expect(
        pms.addAvailability(spotId, testDate, startTimeStr, endTimeStr)
      ).rejects.toThrow("System not loaded from database yet.");
    });

    it("should return false for invalid start/end times", async () => {
      const result = await pms.addAvailability(
        spotId,
        testDate,
        "14:00",
        "13:00"
      );
      expect(result).toBe(false);
      expect(mockParkingSpotModel.findById).not.toHaveBeenCalled();
      expect(mockSpot.save).not.toHaveBeenCalled();
      expect(mockTreeAdd).not.toHaveBeenCalled();
      expect(pms.intervalDataStore.size).toBe(0);
    });

    it("should return false if spot not found", async () => {
      mockParkingSpotModel.findById.mockResolvedValue(null);
      const result = await pms.addAvailability(
        spotId,
        testDate,
        startTimeStr,
        endTimeStr
      );
      expect(result).toBe(false);
      expect(mockParkingSpotModel.findById).toHaveBeenCalledWith(spotId);
      expect(mockSpot.save).not.toHaveBeenCalled();
    });

    it("should add availability to DB, memory tree, and data store", async () => {
      const result = await pms.addAvailability(
        spotId,
        testDate,
        startTimeStr,
        endTimeStr,
        { type: "Test Type", charger: "Type 2" }
      );

      expect(result).toBe(true);
      expect(mockParkingSpotModel.findById).toHaveBeenCalledWith(spotId);
      // Check that push was called on the mock spot's schedule array
      expect(mockSpot.availability_schedule.push).toHaveBeenCalledWith(
        expect.objectContaining({
          date: testDate,
          start_time: startTimeStr,
          end_time: endTimeStr,
          is_available: true,
          type: "Test Type",
          charger: "Type 2",
        })
      );
      expect(mockSpot.save).toHaveBeenCalledTimes(1);

      // Verify tree update
      const expectedStart = combineDateTime(testDate, startTimeStr).getTime();
      const expectedEnd = combineDateTime(testDate, endTimeStr).getTime();
      expect(mockTreeAdd).toHaveBeenCalledTimes(1);
      expect(mockTreeAdd).toHaveBeenCalledWith(
        expectedStart,
        expectedEnd,
        addedScheduleId
      ); // Use captured ID

      // Verify data store update
      expect(pms.intervalDataStore.size).toBe(1);
      expect(pms.intervalDataStore.get(addedScheduleId)).toEqual({
        spotId: spotId,
        scheduleId: addedScheduleId,
      });
    });

    it("should handle errors during save", async () => {
      const saveError = new Error("Failed to save");
      mockSpot.save.mockRejectedValue(saveError);

      const result = await pms.addAvailability(
        spotId,
        testDate,
        startTimeStr,
        endTimeStr
      );

      expect(result).toBe(false);
      expect(mockSpot.save).toHaveBeenCalledTimes(1);
      expect(mockTreeAdd).not.toHaveBeenCalled(); // Tree should not be updated
      expect(pms.intervalDataStore.size).toBe(0); // Data store should not be updated
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("ERROR adding availability:"),
        expect.any(Error)
      );
    });
  });

  describe("removeAvailability", () => {
    const spotId = new mongoose.Types.ObjectId().toString();
    const scheduleId = new mongoose.Types.ObjectId().toString();
    const testDate = new Date(2025, 5, 15);
    const startTimeStr = "09:00";
    const endTimeStr = "11:00";
    let mockScheduleEntry;
    let mockSpot;
    let startMs, endMs;

    beforeEach(() => {
      mockScheduleEntry = createMockSchedule(
        scheduleId,
        testDate,
        startTimeStr,
        endTimeStr
      );
      mockSpot = createMockSpot(spotId, [mockScheduleEntry]);
      mockParkingSpotModel.findById.mockResolvedValue(mockSpot); // Not actually used by removeAvailability
      mockParkingSpotModel.updateOne.mockResolvedValue({
        modifiedCount: 1,
        matchedCount: 1,
      }); // Simulate successful DB removal

      pms.isLoaded = true; // Assume loaded

      // Pre-populate the tree AND data store for removal tests
      startMs = combineDateTime(testDate, startTimeStr).getTime();
      endMs = combineDateTime(testDate, endTimeStr).getTime();
      pms.intervalDataStore.set(scheduleId, { spotId, scheduleId }); // Manually set data store for test setup
    });

    it("should throw error if system is not loaded", async () => {
      pms.isLoaded = false;
      await expect(pms.removeAvailability(spotId, scheduleId)).rejects.toThrow(
        "System not loaded from database yet."
      );
    });

    it("should remove availability from DB, memory tree, and data store", async () => {
      const result = await pms.removeAvailability(spotId, scheduleId);

      expect(result).toBe(true);
      // Check DB update
      expect(mockParkingSpotModel.updateOne).toHaveBeenCalledWith(
        { _id: spotId },
        { $pull: { availability_schedule: { _id: scheduleId } } }
      );
      // Check tree removal
      expect(mockTreeRemove).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId); // Uses scheduleId as intervalId
      // Check data store removal
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false);
    });

    it("should handle DB update failure (modifiedCount 0) and log inconsistency", async () => {
      mockParkingSpotModel.updateOne.mockResolvedValue({
        modifiedCount: 0,
        matchedCount: 1,
      }); // Simulate DB not modified

      const result = await pms.removeAvailability(spotId, scheduleId);

      expect(result).toBe(false); // Based on modifiedCount
      expect(mockParkingSpotModel.updateOne).toHaveBeenCalled();
      // Tree removal still happens
      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId);
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false); // Data store removal also happens

      // Check warning logs
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(`WARN: DB remove command didn't modify spot`)
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `INCONSISTENCY: Schedule ${scheduleId} not removed from DB but interval ${scheduleId} was removed from memory tree.`
        )
      );
    });

    it("should handle tree removal failure and log inconsistency", async () => {
      mockTreeRemove.mockReturnValue(false); // Simulate tree removal failure

      const result = await pms.removeAvailability(spotId, scheduleId);

      expect(result).toBe(true); // Based on DB modification success
      expect(mockParkingSpotModel.updateOne).toHaveBeenCalled();
      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId);
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false); // Data store removal still happens

      // Check warning/error logs
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `WARN: Interval ${scheduleId} not found in tree for removal.`
        )
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `CRITICAL INCONSISTENCY: Schedule ${scheduleId} removed from DB but interval ${scheduleId} NOT found/removed in memory tree!`
        )
      );
    });

    it("should handle errors during DB update", async () => {
      const dbError = new Error("DB write failed");
      mockParkingSpotModel.updateOne.mockRejectedValue(dbError);

      const result = await pms.removeAvailability(spotId, scheduleId);

      expect(result).toBe(false);
      expect(mockParkingSpotModel.updateOne).toHaveBeenCalled();
      expect(mockTreeRemove).not.toHaveBeenCalled(); // Tree/store not changed on DB error
      expect(pms.intervalDataStore.has(scheduleId)).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("ERROR removing availability:"),
        expect.any(Error)
      );
    });
  });

  describe("allocateSpot", () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const spotId = new mongoose.Types.ObjectId().toString();
    const scheduleId = new mongoose.Types.ObjectId().toString();
    const testDate = new Date(2025, 7, 20); // Aug 20, 2025

    const availStart = combineDateTime(testDate, "08:00");
    const availEnd = combineDateTime(testDate, "18:00");
    const availStartMs = availStart.getTime();
    const availEndMs = availEnd.getTime();

    let mockScheduleEntry;
    let mockSpot;
    let mockBookingInstance;

    beforeEach(() => {
      mockScheduleEntry = createMockSchedule(
        scheduleId,
        testDate,
        "08:00",
        "18:00"
      );
      mockSpot = createMockSpot(spotId, [mockScheduleEntry]);

      // Mock the findById().session() chain
      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(), // Return chainable object
        select: jest.fn().mockReturnThis(), // Add select for re-fetch after push
        exec: jest.fn().mockResolvedValue(mockSpot), // Default mock for findById calls
      });

      mockParkingSpotModel.updateOne.mockResolvedValue({ modifiedCount: 1 }); // Default success for pull/push

      // Mock Booking constructor and save
      mockBookingInstance = {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        spot: spotId,
        start_datetime: null,
        end_datetime: null,
        schedule: scheduleId,
        toObject: jest.fn(function () {
          return this;
        }),
      };
      mockBookingModel.mockImplementation(() => mockBookingInstance); // Return instance when constructed
      mockBookingModel.prototype.save = jest
        .fn()
        .mockResolvedValue(mockBookingInstance); // Mock save

      pms.isLoaded = true; // Assume loaded

      // Pre-populate tree and data store
      pms.intervalDataStore.set(scheduleId, { spotId, scheduleId });
      // Mock tree search to return the interval for allocation tests
      mockTreeSearch.mockImplementation((reqStart, reqEnd) => {
        if (reqStart >= availStartMs && reqEnd <= availEndMs) {
          return [{ start: availStartMs, end: availEndMs, id: scheduleId }];
        }
        if (reqStart < availEndMs && reqEnd > availStartMs) {
          // Overlaps
          return [{ start: availStartMs, end: availEndMs, id: scheduleId }];
        }
        return [];
      });
    });

    it("should throw error if system is not loaded", async () => {
      pms.isLoaded = false;
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      await expect(pms.allocateSpot(reqStart, reqEnd, userId)).rejects.toThrow(
        "System not loaded from database yet."
      );
    });

    it("should return null if request start time is after end time", async () => {
      const reqStart = combineDateTime(testDate, "13:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      const result = await pms.allocateSpot(reqStart, reqEnd, userId);
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Request start time must be before end time")
      );
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it("should return null if userId is missing", async () => {
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      const result = await pms.allocateSpot(reqStart, reqEnd, null);
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("User ID is required")
      );
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it("should return null if no suitable interval found in memory tree", async () => {
      const reqStart = combineDateTime(testDate, "07:00"); // Starts before available
      const reqEnd = combineDateTime(testDate, "09:00");
      mockTreeSearch.mockReturnValue([]); // Explicitly return empty for this test case

      const result = await pms.allocateSpot(reqStart, reqEnd, userId);
      expect(result).toBeNull();
      expect(mockTreeSearch).toHaveBeenCalledWith(
        reqStart.getTime(),
        reqEnd.getTime()
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          "No available spot fully contains the requested time."
        )
      );
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it("should successfully allocate a spot (exact match) and update memory", async () => {
      const reqStart = availStart;
      const reqEnd = availEnd;

      // Mock DB interactions within transaction
      mockSpot.availability_schedule.id.mockReturnValue(mockScheduleEntry); // Found schedule
      mockParkingSpotModel.updateOne.mockResolvedValueOnce({
        modifiedCount: 1,
      }); // Successful pull

      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSpot), // Return the spot
      });

      const result = await pms.allocateSpot(reqStart, reqEnd, userId, {
        booking_type: "test_booking",
      });

      expect(result).not.toBeNull();
      expect(result.user).toBe(userId);
      expect(result.spot).toBe(spotId);
      expect(result.schedule).toBe(scheduleId);
      expect(result.start_datetime).toEqual(reqStart);
      expect(result.end_datetime).toEqual(reqEnd);

      expect(mongoose.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockParkingSpotModel.findById).toHaveBeenCalledWith(spotId);
      expect(mockSpot.availability_schedule.id).toHaveBeenCalledWith(
        scheduleId
      );
      expect(mockBookingModel.prototype.save).toHaveBeenCalledTimes(1);
      expect(mockBookingModel).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          booking_type: "test_booking",
          spot: spotId,
          start_datetime: reqStart,
          end_datetime: reqEnd,
          status: "active",
          base_rate: mockSpot.hourly_price,
          payment_status: "pending",
          schedule: scheduleId,
        })
      );
      expect(mockParkingSpotModel.updateOne).toHaveBeenCalledTimes(1);
      expect(mockParkingSpotModel.updateOne).toHaveBeenCalledWith(
        { _id: spotId },
        { $pull: { availability_schedule: { _id: scheduleId } } },
        { session: mockSession }
      );

      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);

      expect(mockTreeRemove).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId); // Original removed
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false); // Data store entry removed
      expect(mockTreeAdd).not.toHaveBeenCalled(); // No splits added
    });

    it("should successfully allocate, create prefix/suffix splits, and update memory", async () => {
      const reqStart = combineDateTime(testDate, "10:00"); // Partial booking
      const reqEnd = combineDateTime(testDate, "15:00");
      const reqStartMs = reqStart.getTime();
      const reqEndMs = reqEnd.getTime();

      mockSpot.availability_schedule.id.mockReturnValue(mockScheduleEntry); // Find original schedule

      mockParkingSpotModel.updateOne.mockResolvedValueOnce({
        modifiedCount: 1,
      }); // Successful pull

      mockParkingSpotModel.updateOne.mockResolvedValueOnce({
        modifiedCount: 1,
      }); // Successful push

      const prefixScheduleId = new mongoose.Types.ObjectId();
      const suffixScheduleId = new mongoose.Types.ObjectId();
      const mockSpotAfterPush = createMockSpot(spotId, [
        createMockSchedule(prefixScheduleId, testDate, "08:00", "10:00"), // Prefix
        createMockSchedule(suffixScheduleId, testDate, "15:00", "18:00"), // Suffix
      ]);
      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockResolvedValue(mockSpotAfterPush),
        })),
        exec: jest.fn().mockResolvedValue(mockSpot),
      });

      const result = await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(result).not.toBeNull();

      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);

      expect(mockParkingSpotModel.updateOne).toHaveBeenCalledTimes(2); // Pull + Push
      expect(mockParkingSpotModel.updateOne).toHaveBeenNthCalledWith(
        2,
        { _id: spotId },
        {
          $push: {
            availability_schedule: {
              $each: [
                expect.objectContaining({
                  start_time: "08:00",
                  end_time: "10:00",
                }),
                expect.objectContaining({
                  start_time: "15:00",
                  end_time: "18:00",
                }),
              ],
            },
          },
        },
        { session: mockSession }
      );

      expect(mockParkingSpotModel.findById).toHaveBeenCalledWith(spotId);
      expect(
        mockParkingSpotModel.findById.mock.results[1].value.select
      ).toHaveBeenCalledWith("availability_schedule");
      expect(
        mockParkingSpotModel.findById.mock.results[1].value.select().exec
      ).toHaveBeenCalledTimes(1);

      expect(mockTreeRemove).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId);
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false);

      expect(mockTreeAdd).toHaveBeenCalledTimes(2);
      const prefixStartMs = combineDateTime(testDate, "08:00").getTime();
      const prefixEndMs = combineDateTime(testDate, "10:00").getTime();
      expect(mockTreeAdd).toHaveBeenCalledWith(
        prefixStartMs,
        prefixEndMs,
        prefixScheduleId.toString()
      );
      expect(pms.intervalDataStore.get(prefixScheduleId.toString())).toEqual({
        spotId: spotId,
        scheduleId: prefixScheduleId.toString(),
      });
      const suffixStartMs = combineDateTime(testDate, "15:00").getTime();
      const suffixEndMs = combineDateTime(testDate, "18:00").getTime();
      expect(mockTreeAdd).toHaveBeenCalledWith(
        suffixStartMs,
        suffixEndMs,
        suffixScheduleId.toString()
      );
      expect(pms.intervalDataStore.get(suffixScheduleId.toString())).toEqual({
        spotId: spotId,
        scheduleId: suffixScheduleId.toString(),
      });
    });

    it("should successfully allocate and create only prefix split, and update memory", async () => {
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = availEnd;

      mockSpot.availability_schedule.id.mockReturnValue(mockScheduleEntry);
      mockParkingSpotModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const prefixScheduleId = new mongoose.Types.ObjectId();
      const mockSpotAfterPush = createMockSpot(spotId, [
        createMockSchedule(prefixScheduleId, testDate, "08:00", "10:00"),
      ]);
      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockResolvedValue(mockSpotAfterPush),
        })),
        exec: jest.fn().mockResolvedValue(mockSpot),
      });

      await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockParkingSpotModel.updateOne).toHaveBeenNthCalledWith(
        2,
        { _id: spotId },
        {
          $push: {
            availability_schedule: {
              $each: [
                expect.objectContaining({
                  start_time: "08:00",
                  end_time: "10:00",
                }),
              ],
            },
          },
        },
        { session: mockSession }
      );

      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId);
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false);
      expect(mockTreeAdd).toHaveBeenCalledTimes(1);
      const prefixStartMs = combineDateTime(testDate, "08:00").getTime();
      const prefixEndMs = combineDateTime(testDate, "10:00").getTime();
      expect(mockTreeAdd).toHaveBeenCalledWith(
        prefixStartMs,
        prefixEndMs,
        prefixScheduleId.toString()
      );
      expect(pms.intervalDataStore.get(prefixScheduleId.toString())).toEqual({
        spotId: spotId,
        scheduleId: prefixScheduleId.toString(),
      });
    });

    it("should successfully allocate and create only suffix split, and update memory", async () => {
      const reqStart = availStart;
      const reqEnd = combineDateTime(testDate, "15:00");

      mockSpot.availability_schedule.id.mockReturnValue(mockScheduleEntry);
      mockParkingSpotModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const suffixScheduleId = new mongoose.Types.ObjectId();
      const mockSpotAfterPush = createMockSpot(spotId, [
        createMockSchedule(suffixScheduleId, testDate, "15:00", "18:00"),
      ]);
      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockResolvedValue(mockSpotAfterPush),
        })),
        exec: jest.fn().mockResolvedValue(mockSpot),
      });

      await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockParkingSpotModel.updateOne).toHaveBeenNthCalledWith(
        2,
        { _id: spotId },
        {
          $push: {
            availability_schedule: {
              $each: [
                expect.objectContaining({
                  start_time: "15:00",
                  end_time: "18:00",
                }),
              ],
            },
          },
        },
        { session: mockSession }
      );

      expect(mockTreeRemove).toHaveBeenCalledWith(scheduleId);
      expect(pms.intervalDataStore.has(scheduleId)).toBe(false);
      expect(mockTreeAdd).toHaveBeenCalledTimes(1);
      const suffixStartMs = combineDateTime(testDate, "15:00").getTime();
      const suffixEndMs = combineDateTime(testDate, "18:00").getTime();
      expect(mockTreeAdd).toHaveBeenCalledWith(
        suffixStartMs,
        suffixEndMs,
        suffixScheduleId.toString()
      );
      expect(pms.intervalDataStore.get(suffixScheduleId.toString())).toEqual({
        spotId: spotId,
        scheduleId: suffixScheduleId.toString(),
      });
    });

    it("should abort transaction if spot not found during transaction", async () => {
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(result).toBeNull();
      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).not.toHaveBeenCalled();
      expect(pms.intervalDataStore.size).toBe(1);
      expect(pms.intervalDataStore.has(scheduleId)).toBe(true);
    });

    it("should abort transaction if original schedule entry not found or unavailable", async () => {
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      mockSpot.availability_schedule.id.mockReturnValue(null);

      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSpot),
      });

      const result = await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(result).toBeNull();
      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).not.toHaveBeenCalled();
      expect(pms.intervalDataStore.size).toBe(1);
    });

    it("should abort transaction if booking save fails", async () => {
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      const saveError = new Error("Booking save failed");
      mockSpot.availability_schedule.id.mockReturnValue(mockScheduleEntry);
      mockBookingModel.prototype.save.mockRejectedValue(saveError);

      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSpot),
      });

      const result = await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(result).toBeNull();
      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).not.toHaveBeenCalled();
      expect(pms.intervalDataStore.size).toBe(1);
    });

    it("should abort transaction if pulling original schedule fails", async () => {
      const reqStart = combineDateTime(testDate, "10:00");
      const reqEnd = combineDateTime(testDate, "12:00");
      mockSpot.availability_schedule.id.mockReturnValue(mockScheduleEntry);
      mockParkingSpotModel.updateOne.mockResolvedValueOnce({
        modifiedCount: 0,
      });

      mockParkingSpotModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSpot),
      });

      const result = await pms.allocateSpot(reqStart, reqEnd, userId);

      expect(result).toBeNull();
      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockTreeRemove).not.toHaveBeenCalled();
      expect(pms.intervalDataStore.size).toBe(1);
    });
  });
});
