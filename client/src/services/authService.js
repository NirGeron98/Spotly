import api from "./api";

export const authService = {
  /**
   * Logs in a user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} - Response with user data and token
   */
  login: async ({ email, password }) => {
    const response = await api.post("/users/login", { email, password });

    // Store authentication data
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  /**
   * Logs out a user by removing auth data from localStorage
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Response with user data and token
   */
  register: async (userData) => {
    const response = await api.post("/users/signup", userData);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  /**
   * Checks if a user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  /**
   * Gets the current user from localStorage
   * @returns {Object|null} - User object or null if not authenticated
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  /**
   * Sends a request to reset password
   * @param {string} email - User email
   * @returns {Promise<Object>} - Response data
   */
  forgotPassword: async (email) => {
    const response = await api.post("/users/forgotPassword", { email });
    return response.data;
  },

  /**
   * Resets password with reset token
   * @param {string} token - Reset token
   * @param {Object} passwordData - Password data
   * @param {string} passwordData.password - New password
   * @param {string} passwordData.passwordConfirm - Password confirmation
   * @returns {Promise<Object>} - Response data
   */
  resetPassword: async (token, passwordData) => {
    const response = await api.patch(
      `/users/resetPassword/${token}`,
      passwordData
    );
    return response.data;
  },
  updateParkingSpot: async (spotId, updateData) => {
    const token = localStorage.getItem("token");

    const response = await api.patch(`/parking-spots/${spotId}`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  getMySpots: async () => {
    const token = localStorage.getItem("token");
    const response = await api.get("/parking-spots/my-spots", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
