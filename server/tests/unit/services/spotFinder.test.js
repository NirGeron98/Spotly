require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const parkingFinder = require("../services/spotFinderService");
const User = require("../models/userModel");

// Connect to database
mongoose
  .connect(process.env.DATABASE_LOCAL || process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful"))
  .catch((err) => console.log("DB connection error:", err));

// Test function with scenarios
async function testParkingFinder() {
  try {
    console.log("======= PARKING FINDER ALGORITHM TEST =======");

    // Test coordinates (Tel Aviv area)
    const testLat = 32.0853;
    const testLon = 34.7818;

    // Test scenario parameters
    const testScenarios = [
      {
        name: "Distance Priority",
        maxPrice: 50,
        userId: null, // Will use default preferences
        preferences: { distance_importance: 9, price_importance: 2 },
      },
      {
        name: "Price Priority",
        maxPrice: 50,
        userId: null,
        preferences: { distance_importance: 2, price_importance: 9 },
      },
      {
        name: "Balanced Preferences",
        maxPrice: 50,
        userId: null,
        preferences: { distance_importance: 5, price_importance: 5 },
      },
    ];

    // Test each scenario
    for (const scenario of testScenarios) {
      console.log(`\n\n===== TESTING SCENARIO: ${scenario.name} =====`);

      // Create/update test user with desired preferences
      const testUser = await createOrUpdateTestUser(scenario.preferences);

      // Find parking spots with algorithm
      console.log("Searching with preferences:", scenario.preferences);
      const spots = await parkingFinder.findParkingSpots(
        testLat,
        testLon,
        scenario.maxPrice,
        "2025-05-07 10:00",
        "2025-05-07 12:00",
        { timezone: "Asia/Jerusalem" },
        10,
        testUser._id
      );

      // Format and print results
      console.log(`Found ${spots.length} available spots`);

      const formattedResults = parkingFinder.formatResults(spots);
      console.table(
        formattedResults.map((spot) => ({
          id: spot.id.toString().slice(-6), // Show last 6 chars of ID
          price: spot.hourly_price + "₪",
          distance: spot.distance_km + "km",
          distanceScore: spot.distance_score,
          priceScore: spot.price_score,
          overallScore: spot.overall_score,
          address: `${spot.address.street} ${spot.address.number}, ${spot.address.city}`,
        }))
      );
    }

    console.log("\nTest completed.");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Helper to create or update test user with specific preferences
async function createOrUpdateTestUser(preferences) {
  const testUserEmail = "algorithm_test@example.com";

  let user = await User.findOne({ email: testUserEmail });

  if (!user) {
    user = await User.create({
      email: testUserEmail,
      password: "Test12345!",
      passwordConfirm: "Test12345!",
      first_name: "Test",
      last_name: "User",
      preferences: preferences,
    });
  } else {
    user = await User.findByIdAndUpdate(
      user._id,
      {
        "preferences.distance_importance": preferences.distance_importance,
        "preferences.price_importance": preferences.price_importance,
      },
      { new: true }
    );
  }

  return user;
}

// Run the test
testParkingFinder();
