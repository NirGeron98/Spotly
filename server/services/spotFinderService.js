const ParkingSpot = require("../models/parkingSpotModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const { fromZonedTime } = require("date-fns-tz"); // Import fromZonedTime

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
   * @param {string} timezone - Timezone for accurate parking spot search
   * @param {string} excludeOwnerId - User ID to exclude from results
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
    timezone = "UTC",
    excludeOwnerId = null
  ) {
    if (!excludeOwnerId) {
      throw new AppError("User ID is required for optimal parking spot search", 400);
    }
    const user = await User.findById(excludeOwnerId);
    if (!user) throw new AppError("User not found", 404);

    const distPref  = user.preferences.distance_importance;
    const pricePref = user.preferences.price_importance;

    // 1) parse times into UTC
    let startUtc, endUtc;
    try {
      startUtc = fromZonedTime(desiredStartTime, timezone);
      endUtc   = fromZonedTime(desiredEndTime, timezone);
    } catch (err) {
      throw new AppError("Invalid desiredStartTime, desiredEndTime, or timezone format.", 400);
    }

    // 2) fetch & filter out owner
    const allSpots = await this._fetchAllSpots(additionalFilters);

    const spotsExcludingOwner = allSpots.filter(
      (s) => s.original.owner._id.toString() !== excludeOwnerId
    );

    // 3) availability
    const available = spotsExcludingOwner.filter((s) =>
      this._checkAvailability(s.availability, startUtc, endUtc)
    );
    if (!available.length) return [];

    // 4) price
    const priceOk = available.filter((s) => s.price_per_hour <= maxPrice);
    if (!priceOk.length) return [];

    // --- Mahalanobis with preference weights ---

    // A) compute raw features [distance, priceRatio]
    const rawFeatures = priceOk.map((spot) => {
      const d  = this._calculateDistance(spot.latitude, spot.longitude, desiredLat, desiredLon);
      const pr = spot.price_per_hour / maxPrice;
      return [d, pr];
    });

    // B) z-score normalize
    const normalized = this._normalizeFeatures(rawFeatures);

    // C) attach back to spots
    priceOk.forEach((spot, i) => {
      const [d, pr]        = rawFeatures[i];
      const [dNorm, pNorm] = normalized[i];
      spot.distance             = d;
      spot.priceRatio           = pr;
      spot.normalizedDistance   = dNorm;
      spot.normalizedPriceRatio = pNorm;
    });

    // D) covariance & inverse
    const covMatrix    = this._calculateCovarianceMatrix(normalized);
    const augCovMatrix = this._handleSingularMatrix(covMatrix);
    const invCovMatrix = this._invertMatrix(augCovMatrix);

    // E) ideal point in normalized space
    const idealPoint = [
      Math.min(...normalized.map((f) => f[0])),
      Math.min(...normalized.map((f) => f[1])),
    ];

    // F) weighted Mahalanobis distance
    priceOk.forEach((spot, i) => {
      const [dNorm, pNorm] = normalized[i];
      // diff from ideal, scaled by preferences
      const diff = [
        (dNorm - idealPoint[0]) * distPref,
        (pNorm - idealPoint[1]) * pricePref,
      ];
      let sum = 0;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          sum += diff[r] * invCovMatrix[r][c] * diff[c];
        }
      }
      spot.score = Math.sqrt(sum);
    });

    // G) sort & limit
    const ranked = priceOk
      .sort((a, b) => a.score - b.score)
      .slice(0, maxResults);

    return ranked;
  }

  _checkAvailability(avails, startUtc, endUtc) {
    if (!Array.isArray(avails) || !avails.length) return false;
    return avails.some((sch) => {
      if (!sch.start_datetime || !sch.end_datetime) return false;
      const s = new Date(sch.start_datetime), e = new Date(sch.end_datetime);
      return sch.is_available && s <= startUtc && e >= endUtc;
    });
  }

  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this._deg2rad(lat2 - lat1), dLon = this._deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2)**2 +
      Math.cos(this._deg2rad(lat1)) *
      Math.cos(this._deg2rad(lat2)) *
      Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  _deg2rad(deg) {
    return (deg * Math.PI) / 180;
  }

  _normalizeFeatures(features) {
    const m = features.length, n = features[0].length;
    const means = Array(n).fill(0), stds = Array(n).fill(0);

    // compute means
    features.forEach(row => row.forEach((v,j) => (means[j] += v)));
    for (let j=0; j<n; j++) means[j] /= m;

    // compute variances
    features.forEach(row => row.forEach((v,j) => (stds[j] += (v - means[j])**2)));
    for (let j=0; j<n; j++) stds[j] = Math.sqrt(stds[j]/m) || 1;

    // return normalized
    return features.map(row => row.map((v,j) => (v - means[j]) / stds[j]));
  }

  _calculateCovarianceMatrix(features) {
    const m = features.length, n = features[0].length;
    const means = Array(n).fill(0),
          cov   = Array(n).fill().map(() => Array(n).fill(0));

    // means
    features.forEach(row => row.forEach((v,j) => (means[j] += v)));
    for (let j=0; j<n; j++) means[j] /= m;

    // covariances
    for (let i=0; i<n; i++) {
      for (let j=0; j<n; j++) {
        let sum = 0;
        for (let k=0; k<m; k++) {
          sum += (features[k][i] - means[i]) * (features[k][j] - means[j]);
        }
        cov[i][j] = sum / (m - 1);
      }
    }
    return cov;
  }

  _handleSingularMatrix(matrix) {
    return matrix.map((row,i) => row.map((v,j) => v + (i===j ? 1e-6 : 0)));
  }

  _invertMatrix(matrix) {
    const n = matrix.length;
    const A = matrix.map(r => [...r]);
    const I = matrix.map((_,i) => Array(n).fill(0).map((__,j) => i===j ? 1 : 0));

    // Gauss-Jordan elimination
    for (let i=0; i<n; i++) {
      let maxRow = i;
      for (let r=i+1; r<n; r++) {
        if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
      }
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [I[i], I[maxRow]] = [I[maxRow], I[i]];

      const pivot = A[i][i];
      if (Math.abs(pivot) < 1e-10) throw new Error("Singular matrix");
      for (let j=0; j<n; j++) {
        A[i][j] /= pivot;
        I[i][j] /= pivot;
      }

      // eliminate other rows
      for (let r=0; r<n; r++) {
        if (r === i) continue;
        const factor = A[r][i];
        for (let c=0; c<n; c++) {
          A[r][c] -= factor * A[i][c];
          I[r][c] -= factor * I[i][c];
        }
      }
    }
    return I;
  }

  async _fetchAllSpots(filters = {}) {
    try {
      const query = { spot_type: "private" };
      if (filters.is_charging_station) {
        query.is_charging_station = true;
        if (filters.charger_type) query.charger_type = filters.charger_type;
      }
      const spots = await ParkingSpot.find(query).populate({
        path: "owner",
        select: "name phone_number email"
      });
      return spots
        .filter(s =>
          s.address?.latitude != null &&
          s.address?.longitude != null &&
          Array.isArray(s.availability_schedule) &&
          s.availability_schedule.length
        )
        .map(s => ({
          spot_id: s._id,
          latitude: s.address.latitude,
          longitude: s.address.longitude,
          price_per_hour: s.hourly_price || 0,
          availability: s.availability_schedule,
          original: s,
          is_charging_station: s.is_charging_station,
          charger_type: s.charger_type
        }));
    } catch (err) {
      console.error("Error fetching parking spots:", err);
      throw new AppError("Failed to fetch parking spots", 500);
    }
  }

  formatResults(rankedSpots) {
    return rankedSpots.map((spot) => {
      const o = spot.original;
      return {
        _id: o._id,
        hourly_price: o.hourly_price,
        address: o.address,
        owner: {
          _id: o.owner._id,
          name: o.owner.name,
          phone_number: o.owner.phone_number,
        },
        //is_charging_station: o.is_charging_station,
        //charger_type: o.charger_type,
        distance_km: parseFloat(spot.distance.toFixed(2)),
        //normalized_distance: parseFloat(spot.normalizedDistance.toFixed(4)),
        //normalized_price_ratio: parseFloat(spot.normalizedPriceRatio.toFixed(4)),
        //score: parseFloat(spot.score.toFixed(4)),
        // availability: o.availability_schedule
        //   .filter((sch) => sch.is_available)
        //   .map((sch) => ({
        //     id: sch._id,
        //     date: sch.date,
        //     start_time: sch.start_time,
        //     end_time: sch.end_time,
        //   })),
      };
    });
  }
}

module.exports = new ParkingSpotFinder();