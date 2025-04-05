/**
 * Mock booking data for testing
 */
const bookings = {
  validBooking: {
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    end_time: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow + 2 hours
    status: "pending",
  },
  pastBooking: {
    start_time: new Date(Date.now() - 48 * 60 * 60 * 1000), // Two days ago
    end_time: new Date(Date.now() - 46 * 60 * 60 * 1000), // Two days ago + 2 hours
    status: "completed",
  },
  invalidBooking: {
    start_time: new Date(Date.now() + 26 * 60 * 60 * 1000), // End time before start time
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: "invalid-status",
  },
  bookingsArray: [
    {
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000),
      status: "pending",
    },
    {
      start_time: new Date(Date.now() + 48 * 60 * 60 * 1000),
      end_time: new Date(Date.now() + 50 * 60 * 60 * 1000),
      status: "confirmed",
    },
    {
      start_time: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end_time: new Date(Date.now(  ) - 22 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      start_time: new Date(Date.now() + 72 * 60 * 60 * 1000),
      end_time: new Date(Date.now() + 74 * 60 * 60 * 1000),
      status: "cancelled",
    },
  ],
};

module.exports = {
  bookings,
};
