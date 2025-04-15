const ParkingSpot = require("../models/parkingSpotModel");
const AppError = require("../utils/appError");

/**
 * ParkingSpotFinder class for finding and ranking parking spots using Mahalanobis distance
 */
class ParkingSpotFinder {
  /**
   * Initialize the ParkingSpotFinder
   */
  constructor() {
    // No need for explicit DB connection as we'll use Mongoose models
  }

  /**
   * Find and rank parking spots based on user preferences
   * @param {number} desiredLat - User's desired latitude
   * @param {number} desiredLon - User's desired longitude
   * @param {number} maxPrice - Maximum price per hour the user is willing to pay
   * @param {string} desiredStartTime - Start time for parking (string in format "YYYY-MM-DD HH:MM")
   * @param {string} desiredEndTime - End time for parking (string in format "YYYY-MM-DD HH:MM")
   * @param {Object} additionalFilters - Additional filters like charger type, etc.
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Array} - Ranked parking spots
   */
  async findParkingSpots(
    desiredLat,
    desiredLon,
    maxPrice,
    desiredStartTime,
    desiredEndTime,
    additionalFilters = {},
    maxResults = 10,
    excludeOwnerId = null
  ) {
    // Convert string times to Date objects
    const desiredStart = new Date(desiredStartTime);
    const desiredEnd = new Date(desiredEndTime);

    // Fetch all parking spots from database with additional filters
    const allSpots = await this._fetchAllSpots(additionalFilters);

    let filteredSpots = allSpots;

    if (excludeOwnerId) {
      filteredSpots = filteredSpots.filter(
        (spot) => spot.original?.owner?._id?.toString() !== excludeOwnerId
      );
    }

    // If no spots are available, return empty array
    if (!filteredSpots || filteredSpots.length === 0) {
      return [];
    }

    // Filter spots by availability
    const availableSpots = filteredSpots.filter((spot) =>
      this._checkAvailability(spot.availability, desiredStart, desiredEnd)
    );

    // If no spots are available, return empty array
    if (availableSpots.length === 0) {
      return [];
    }

    // Apply price filter
    const priceFilteredSpots = availableSpots.filter(
      (spot) => spot.price_per_hour <= maxPrice
    );

    // If no spots match price criteria, return empty array
    if (priceFilteredSpots.length === 0) {
      return [];
    }

    // Calculate features for each spot
    const spotsWithFeatures = priceFilteredSpots.map((spot) => {
      const distance = this._calculateDistance(
        spot.latitude,
        spot.longitude,
        desiredLat,
        desiredLon
      );
      const priceRatio = spot.price_per_hour / maxPrice;

      return {
        ...spot,
        distance,
        priceRatio,
      };
    });

    // Extract features for normalization and Mahalanobis distance calculation
    const features = spotsWithFeatures.map((spot) => [
      spot.distance,
      spot.price_per_hour,
      spot.priceRatio,
    ]);

    // If we have too few spots, we can't calculate Mahalanobis distance reliably
    // Just sort by distance and price in this case
    if (features.length < 4) {
      const simpleRankedSpots = spotsWithFeatures.sort((a, b) => {
        // Normalize scores between 0-1 and combine them
        const distanceScore = a.distance / (a.distance + b.distance);
        const priceScore =
          a.price_per_hour / (a.price_per_hour + b.price_per_hour);
        return distanceScore + priceScore - (distanceScore + priceScore);
      });

      return simpleRankedSpots.slice(0, maxResults);
    }

    // Normalize features
    const normalizedFeatures = this._normalizeFeatures(features);

    // Calculate covariance matrix
    const covMatrix = this._calculateCovarianceMatrix(normalizedFeatures);

    // Handle potential singular matrix by adding small noise
    const augmentedCovMatrix = this._handleSingularMatrix(covMatrix);

    // Calculate inverse of covariance matrix
    const invCovMatrix = this._invertMatrix(augmentedCovMatrix);

    // Calculate Mahalanobis distance for each spot
    const idealPoint = [0, 0, 0]; // [distance, price, priceRatio] - Ideal is minimum of each

    for (let i = 0; i < spotsWithFeatures.length; i++) {
      const mahalanobisDistance = this._calculateMahalanobisDistance(
        normalizedFeatures[i],
        idealPoint,
        invCovMatrix
      );
      spotsWithFeatures[i].mahalanobisDistance = mahalanobisDistance;
    }

    // Sort by Mahalanobis distance (lowest to highest)
    const rankedSpots = spotsWithFeatures.sort(
      (a, b) => a.mahalanobisDistance - b.mahalanobisDistance
    );

    // Return top results
    return rankedSpots.slice(0, maxResults);
  }

  /**
   * Check if a parking spot is available during the desired time slot
   * @param {Array} spotAvailability - List of availability slots for the spot
   * @param {Date} desiredStart - Desired start time
   * @param {Date} desiredEnd - Desired end time
   * @returns {boolean} - True if spot is available, False otherwise
   */
  _checkAvailability(spotAvailability, desiredStart, desiredEnd) {
    if (
      !spotAvailability ||
      !Array.isArray(spotAvailability) ||
      spotAvailability.length === 0
    ) {
      return false;
    }

    const desiredDate = desiredStart.toISOString().split("T")[0];

    return spotAvailability.some((schedule) => {
      // Check if dates match first
      const scheduleDate = new Date(schedule.date);
      const scheduleDateStr = scheduleDate.toISOString().split("T")[0];

      if (scheduleDateStr !== desiredDate) return false;

      // Parse start and end times
      const [startHour, startMinute] = schedule.start_time
        .split(":")
        .map(Number);
      const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

      const scheduleStartDate = new Date(scheduleDate);
      scheduleStartDate.setHours(startHour, startMinute, 0);

      const scheduleEndDate = new Date(scheduleDate);
      scheduleEndDate.setHours(endHour, endMinute, 0);

      // Check if desired time slot is completely within an available slot
      return (
        scheduleStartDate <= desiredStart &&
        scheduleEndDate >= desiredEnd &&
        schedule.is_available === true
      );
    });
  }

  /**
   * Calculate the geographic distance between two points in kilometers
   * @param {number} lat1 - Latitude of the first point
   * @param {number} lon1 - Longitude of the first point
   * @param {number} lat2 - Latitude of the second point
   * @param {number} lon2 - Longitude of the second point
   * @returns {number} - Distance in kilometers
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this._deg2rad(lat2 - lat1);
    const dLon = this._deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._deg2rad(lat1)) *
        Math.cos(this._deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Angle in degrees
   * @returns {number} - Angle in radians
   */
  _deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Normalize features to have mean 0 and standard deviation 1
   * @param {Array} features - 2D array of features [n_samples, n_features]
   * @returns {Array} - Normalized features
   */
  _normalizeFeatures(features) {
    const numFeatures = features[0].length;
    const numSamples = features.length;

    const means = Array(numFeatures).fill(0);
    const stds = Array(numFeatures).fill(0);

    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < numFeatures; j++) {
        means[j] += features[i][j];
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      means[j] /= numSamples;
    }

    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < numFeatures; j++) {
        stds[j] += Math.pow(features[i][j] - means[j], 2);
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      stds[j] = Math.sqrt(stds[j] / numSamples);
      if (stds[j] === 0) stds[j] = 1;
    }

    const normalizedFeatures = [];
    for (let i = 0; i < numSamples; i++) {
      const normalizedSample = [];
      for (let j = 0; j < numFeatures; j++) {
        normalizedSample.push((features[i][j] - means[j]) / stds[j]);
      }
      normalizedFeatures.push(normalizedSample);
    }

    return normalizedFeatures;
  }

  /**
   * Calculate the covariance matrix for a set of features
   * @param {Array} features - 2D array of features [n_samples, n_features]
   * @returns {Array} - Covariance matrix
   */
  _calculateCovarianceMatrix(features) {
    const numFeatures = features[0].length;
    const numSamples = features.length;

    const covMatrix = Array(numFeatures)
      .fill()
      .map(() => Array(numFeatures).fill(0));

    const means = Array(numFeatures).fill(0);
    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < numFeatures; j++) {
        means[j] += features[i][j];
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      means[j] /= numSamples;
    }

    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        let sum = 0;
        for (let k = 0; k < numSamples; k++) {
          sum += (features[k][i] - means[i]) * (features[k][j] - means[j]);
        }
        covMatrix[i][j] = sum / (numSamples - 1);
      }
    }

    return covMatrix;
  }

  /**
   * Handle potential singular matrix by adding small noise
   * @param {Array} matrix - Input matrix
   * @returns {Array} - Matrix with small regularization if needed
   */
  _handleSingularMatrix(matrix) {
    const n = matrix.length;
    const augmentedMatrix = JSON.parse(JSON.stringify(matrix));

    for (let i = 0; i < n; i++) {
      augmentedMatrix[i][i] += 1e-6;
    }

    return augmentedMatrix;
  }

  /**
   * Calculate the inverse of a matrix using Gaussian elimination
   * @param {Array} matrix - Input matrix
   * @returns {Array} - Inverse matrix
   */
  _invertMatrix(matrix) {
    const n = matrix.length;

    const augmented = [];
    for (let i = 0; i < n; i++) {
      augmented[i] = [];
      for (let j = 0; j < n; j++) {
        augmented[i][j] = matrix[i][j];
      }
      for (let j = 0; j < n; j++) {
        augmented[i][j + n] = i === j ? 1 : 0;
      }
    }

    for (let i = 0; i < n; i++) {
      let maxVal = Math.abs(augmented[i][i]);
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(augmented[j][i]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = j;
        }
      }

      if (maxRow !== i) {
        for (let j = 0; j < 2 * n; j++) {
          const temp = augmented[i][j];
          augmented[i][j] = augmented[maxRow][j];
          augmented[maxRow][j] = temp;
        }
      }

      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error("Matrix is singular");
      }

      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = augmented[j][i];
          for (let k = 0; k < 2 * n; k++) {
            augmented[j][k] -= factor * augmented[i][k];
          }
        }
      }
    }

    const inverse = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = [];
      for (let j = 0; j < n; j++) {
        inverse[i][j] = augmented[i][j + n];
      }
    }

    return inverse;
  }

  /**
   * Calculate the Mahalanobis distance between two points
   * @param {Array} x - First point
   * @param {Array} y - Second point
   * @param {Array} invCov - Inverse of covariance matrix
   * @returns {number} - Mahalanobis distance
   */
  _calculateMahalanobisDistance(x, y, invCov) {
    const n = x.length;
    const diff = Array(n);

    for (let i = 0; i < n; i++) {
      diff[i] = x[i] - y[i];
    }

    let sum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sum += diff[i] * invCov[i][j] * diff[j];
      }
    }

    return Math.sqrt(sum);
  }

  /**
   * Fetch all parking spots from the database
   * @param {Object} filters - Additional filters to apply to the query
   * @returns {Promise<Array>} - List of parking spots
   */
  async _fetchAllSpots(filters = {}) {
    try {
      const query = {
        spot_type: "private",
        is_available: true,
      };

      if (filters.is_charging_station) {
        query.is_charging_station = true;

        if (filters.charger_type) {
          query.charger_type = filters.charger_type;
        }
      }

      const parkingSpots = await ParkingSpot.find(query).populate({
        path: "owner",
        select: "name phone_number email",
      });

      const formattedSpots = parkingSpots
        .filter(
          (spot) =>
            spot.address &&
            spot.address.latitude &&
            spot.address.longitude &&
            spot.availability_schedule &&
            spot.availability_schedule.length > 0
        )
        .map((spot) => ({
          spot_id: spot._id,
          latitude: spot.address.latitude,
          longitude: spot.address.longitude,
          price_per_hour: spot.hourly_price || 0,
          availability: spot.availability_schedule,
          original: spot,
          is_charging_station: spot.is_charging_station,
          charger_type: spot.charger_type,
        }));

      return formattedSpots;
    } catch (error) {
      console.error("Error fetching parking spots:", error);
      throw new AppError("Failed to fetch parking spots from database", 500);
    }
  }

  /**
   * Format the ranked spots for API response
   * @param {Array} rankedSpots - Ranked parking spots
   * @returns {Array} - Formatted spots for API response
   */
  formatResults(rankedSpots) {
    return rankedSpots.map((spot) => {
      const original = spot.original;

      return {
        _id: original._id,
        hourly_price: original.hourly_price,
        address: original.address,
        owner: {
          _id: original.owner._id,
          name: original.owner.name,
          phone_number: original.owner.phone_number,
        },
        is_charging_station: original.is_charging_station,
        charger_type: original.charger_type,
        distance_km: parseFloat(spot.distance.toFixed(2)),
        score: parseFloat(spot.mahalanobisDistance?.toFixed(4) || "0"),
        availability: original.availability_schedule
          .filter((schedule) => schedule.is_available)
          .map((schedule) => ({
            id: schedule._id,
            date: schedule.date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
          })),
      };
    });
  }
}

// Export the class for use in other modules
module.exports = new ParkingSpotFinder();
