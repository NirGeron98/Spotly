import api from "./api";

export const parkingSpotService = {
  // Basic CRUD operations
  getAllParkingSpots: () => api.get("/parking-spots"),
  getParkingSpot: (id) => api.get(`/parking-spots/${id}`),
  createParkingSpot: (data) => api.post("/parking-spots", data),
  updateParkingSpot: (id, data) => api.patch(`/parking-spots/${id}`, data),
  deleteParkingSpot: (id) => api.delete(`/parking-spots/${id}`),

  // Get personal spots
  getMyParkingSpots: () => api.get("/parking-spots/my-spots"),

  // General availability
  toggleAvailability: (id, isAvailable) =>
    api.patch(`/parking-spots/${id}/availability`, {
      is_available: isAvailable,
    }),

  // Availability schedules for private spots
  addAvailabilitySchedule: (spotId, scheduleData) =>
    api.post(`/parking-spots/${spotId}/availability-schedule`, scheduleData),

  updateAvailabilitySchedule: (spotId, scheduleId, scheduleData) =>
    api.patch(
      `/parking-spots/${spotId}/availability-schedule/${scheduleId}`,
      scheduleData
    ),

  removeAvailabilitySchedule: (spotId, scheduleId) =>
    api.delete(`/parking-spots/${spotId}/availability-schedule/${scheduleId}`),

  // Special queries
  getAvailablePrivateSpots: () => api.get("/parking-spots/private-available"),
  getChargingStations: () => api.get("/parking-spots/charging-stations"),
  getAvailableParkingSpots: (startTime, endTime, filters = {}) => {
    // Convert startTime and endTime to ISO strings if they are Date objects
    const start =
      startTime instanceof Date ? startTime.toISOString() : startTime;
    const end = endTime instanceof Date ? endTime.toISOString() : endTime;

    return api.get("/parking-spots/available", {
      params: { startTime: start, endTime: end, ...filters },
    });
  },

  // Release parking endpoints
  releaseParkingSpot: (spotData) =>
    api.post("/parking-spots/release", spotData),
  getMyReleasedSpots: () => api.get("/parking-spots/my-released"),

  // New optimized parking spot finder using Mahalanobis distance
  findOptimalParkingSpots: (searchParams) =>
    api.post("/parking-spots/find-optimal", searchParams),
};

export default parkingSpotService;
