/**
 * Mock parking spot data for testing
 */
const parkingSpots = {
  validParkingSpot: {
    name: "Test Parking Spot",
    location: {
      type: "Point",
      coordinates: [34.781768, 32.0853], // Tel Aviv coordinates
      address: "Test Address, Tel Aviv",
    },
    price: 15.0,
    is_available: true,
    is_covered: true,
    size: "standard",
    image: "parking-spot.jpg",
    description: "Nice parking spot in Tel Aviv",
  },
  invalidParkingSpot: {
    name: "",
    location: {
      type: "Point",
      coordinates: [0, 0],
      address: "",
    },
    price: -5,
    is_available: "not-boolean",
    size: "invalid-size",
  },
  multipleParkingSpots: [
    {
      name: "Spot 1",
      location: {
        type: "Point",
        coordinates: [34.781768, 32.0853],
        address: "Address 1, Tel Aviv",
      },
      price: 10.0,
      is_available: true,
      size: "compact",
    },
    {
      name: "Spot 2",
      location: {
        type: "Point",
        coordinates: [34.782, 32.086],
        address: "Address 2, Tel Aviv",
      },
      price: 20.0,
      is_available: true,
      size: "standard",
    },
    {
      name: "Spot 3",
      location: {
        type: "Point",
        coordinates: [34.783, 32.087],
        address: "Address 3, Tel Aviv",
      },
      price: 30.0,
      is_available: false,
      size: "large",
    },
  ],
};

module.exports = {
  parkingSpots,
};
