const axios = require('axios');

/**
 * Geocodes an address to get latitude and longitude coordinates
 * Using Nominatim OpenStreetMap service (free)
 *
 * @param {Object} address - Address object containing city, street and optionally number
 * @returns {Promise<Object>} - Result object with success flag and coordinates or error message
 */
exports.geocode = async ({ city, street, number = '' }) => {
  try {
    // Create a query string from the address components
    const query = `${number} ${street}, ${city}, Israel`.trim();
    const encodedQuery = encodeURIComponent(query);

    // Make request to Nominatim API
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Spotly/1.0', // Nominatim requires a User-Agent header
        },
      },
    );

    // Check if any results were returned
    if (response.data && response.data.length > 0) {
      return {
        success: true,
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name,
        address_details: response.data[0].address,
      };
    }

    // No results found
    return {
      success: false,
      message: 'No results found for the provided address',
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      success: false,
      message: error.message || 'An error occurred while geocoding',
    };
  }
};

/**
 * Reverse geocodes coordinates to get address information
 *
 * @param {Number} lat - Latitude coordinate
 * @param {Number} lon - Longitude coordinate
 * @returns {Promise<Object>} - Result object with success flag and address information or error message
 */
exports.reverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Spotly/1.0',
        },
      },
    );

    if (response.data && response.data.address) {
      // Extract address components
      const address = response.data.address;

      return {
        success: true,
        city: address.city || address.town || address.village || '',
        street: address.road || '',
        number: address.house_number || '',
        display_name: response.data.display_name,
        address_details: address,
      };
    }

    return {
      success: false,
      message: 'Could not determine address from coordinates',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return {
      success: false,
      message: error.message || 'An error occurred while reverse geocoding',
    };
  }
};
