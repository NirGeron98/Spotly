import api from "./api";

export const buildingService = {
  /**
   * Get building information by building code
   * @param {string} code - Building code
   * @returns {Promise} Response from API
   */
  getBuildingByCode: async (code) => {
    try {
      const response = await api.get(`/buildings/byCode/${code}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching building by code:", error);
      throw error;
    }
  },

  /**
   * Format building address for display
   * @param {Object} building - Building object with address information
   * @returns {String} Formatted address string
   */
  formatBuildingAddress: (building) => {
    if (!building || !building.address) return "";

    const { address } = building;
    return `${address.street} ${address.number}, ${address.city}`;
  },

  /**
   * Get building address components
   * @param {Object} building - Building object with address information
   * @returns {Object} Address components object with city, street, and number properties
   */
  getBuildingAddressComponents: (building) => {
    if (!building || !building.address) {
      return { city: "", street: "", number: "" };
    }

    return {
      city: building.address.city || "",
      street: building.address.street || "",
      number: building.address.number?.toString() || "",
    };
  },
};

export default buildingService;
