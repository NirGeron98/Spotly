const Building = require("../models/buildingModel");
const AppError = require("../utils/appError");

/**
 * Service layer for building-related operations
 */
class BuildingService {
  /**
   * Create a new building
   * @param {Object} buildingData - Data for the new building
   * @returns {Promise<Object>} The created building
   */
  async createBuilding(buildingData) {
    // Check that address is provided and complete
    const { address } = buildingData;
    if (!address || !address.city || !address.street || !address.number) {
      throw new AppError(
        "Address is required with city, street and building number",
        400
      );
    }

    // Convert address.number to a number type if it's a string
    if (typeof address.number === "string") {
      buildingData.address.number = parseInt(address.number, 10);

      if (isNaN(buildingData.address.number)) {
        throw new AppError("Building number must be a valid number", 400);
      }
    }

    // Check if a building with the same address already exists
    const existingBuilding = await Building.findOne({
      "address.city": address.city,
      "address.street": address.street,
      "address.number": address.number,
    });

    if (existingBuilding) {
      throw new AppError("Building with this address already exists!", 400);
    }

    // Create the building if it doesn't exist
    return await Building.create(buildingData);
  }

  /**
   * Get a building by ID
   * @param {string} id - Building ID
   * @returns {Promise<Object>} The building data
   */
  async getBuildingById(id) {
    const building = await Building.findById(id);

    if (!building) {
      throw new AppError("Building not found", 404);
    }

    return building;
  }

  /**
   * Get all buildings, with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} List of buildings
   */
  async getAllBuildings(filters = {}) {
    return await Building.find(filters);
  }

  /**
   * Get a building by its building_number code
   * @param {string} code - Building code (building_number)
   * @returns {Promise<Object>} The building data
   */
  async getBuildingByCode(code) {
    const building = await Building.findOne({ building_number: code });

    if (!building) {
      throw new AppError("No building found with that code", 404);
    }

    return building;
  }

  /**
   * Update a building resident
   * @param {string} buildingId - Building ID
   * @param {string} userId - Current user ID
   * @param {string} newResidentId - New resident user ID
   * @returns {Promise<Object>} The updated building
   */
  async updateBuildingResident(buildingId, userId, newResidentId) {
    // Find the building by its ID
    const building = await Building.findById(buildingId);

    if (!building) {
      throw new AppError("No building found with that ID", 404);
    }

    // Check if the resident exists in the building
    const resident = building.residents.find(
      (resident) => resident.user_id.toString() === userId
    );

    if (!resident) {
      throw new AppError(
        "No resident found with that ID in this building",
        404
      );
    }

    // Update the resident user ID
    resident.user_id = newResidentId;

    // Save the updated building document
    await building.save();

    return building;
  }

  /**
   * Update a building
   * @param {string} id - Building ID
   * @param {Object} updateData - New building data
   * @returns {Promise<Object>} The updated building
   */
  async updateBuilding(id, updateData) {
    const building = await Building.findById(id);

    if (!building) {
      throw new AppError("Building not found", 404);
    }

    // If address fields are being updated, check for duplicates
    if (updateData.city || updateData.street || updateData.building_number) {
      const addressFields = {
        city: updateData.city || building.city,
        street: updateData.street || building.street,
        building_number: updateData.building_number || building.building_number,
      };

      const existingBuilding = await Building.findOne({
        _id: { $ne: id }, // Exclude current building
        ...addressFields,
      });

      if (existingBuilding) {
        throw new AppError("Building with this address already exists!", 400);
      }
    }

    return await Building.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete a building
   * @param {string} id - Building ID
   * @returns {Promise<void>}
   */
  async deleteBuilding(id) {
    const building = await Building.findById(id);

    if (!building) {
      throw new AppError("Building not found", 404);
    }

    // Check if building has residents
    if (building.residents && building.residents.length > 0) {
      throw new AppError("Cannot delete a building with residents", 400);
    }

    await Building.findByIdAndDelete(id);
  }

  /**
   * Add a resident to a building
   * @param {string} buildingId - Building ID
   * @param {string} userId - User ID to add as resident
   * @param {Object} residentData - Additional resident data
   * @returns {Promise<Object>} The updated building
   */
  async addResident(buildingId, userId, residentData = {}) {
    const building = await Building.findById(buildingId);

    if (!building) {
      throw new AppError("Building not found", 404);
    }

    // Check if user is already a resident
    const isAlreadyResident = building.residents.some(
      (resident) => resident.user_id.toString() === userId
    );

    if (isAlreadyResident) {
      throw new AppError("User is already a resident of this building", 400);
    }

    // Add new resident
    building.residents.push({
      user_id: userId,
      ...residentData,
    });

    await building.save();

    return building;
  }

  /**
   * Remove a resident from a building
   * @param {string} buildingId - Building ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} The updated building
   */
  async removeResident(buildingId, userId) {
    const building = await Building.findById(buildingId);

    if (!building) {
      throw new AppError("Building not found", 404);
    }

    // Find resident index
    const residentIndex = building.residents.findIndex(
      (resident) => resident.user_id.toString() === userId
    );

    if (residentIndex === -1) {
      throw new AppError("User is not a resident of this building", 404);
    }

    // Remove resident
    building.residents.splice(residentIndex, 1);
    await building.save();

    return building;
  }
}

module.exports = new BuildingService();
