import api from "./api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const authService = {
  /**
   * Logs in a user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} - Response with user data and token
   */
  login: async ({ email, password }) => {
    try {
      const response = await api.post("/api/v1/users/login", {
        email,
        password,
      });

      const { token, data } = response.data;

      if (token && typeof Storage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Login error details:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url,
      });
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/api/v1/users/signup", userData);

      const { token, data } = response.data;

      if (token && typeof Storage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Registration error:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url,
      });
      throw error;
    }
  },

  /**
   * Logs out a user by removing auth data from localStorage
   */
  logout: async () => {
    try {
      await api.post("/api/v1/users/logout");
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch (error) {
      console.error("Logout error:", error.response?.data || error.message);
      // Still remove items even if the API call fails
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      throw error;
    }
  },

  /**
   * Checks if a user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    if (typeof Storage === 'undefined') return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Gets the current user from localStorage
   * @returns {Object|null} - User object or null if not authenticated
   */
  getCurrentUser: () => {
    if (typeof Storage === 'undefined') return null;
    
    const userStr = localStorage.getItem(USER_KEY);
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
    const response = await api.post("/api/v1/users/forgotPassword", { email });
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
      `/api/v1/users/resetPassword/${token}`,
      passwordData
    );

    return response.data;
  },
  
  updateParkingSpot: async (spotId, updateData) => {
    const token = typeof Storage !== 'undefined' ? localStorage.getItem("token") : null;

    const response = await api.patch(`/parking-spots/${spotId}`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  getMySpots: async () => {
    const token = typeof Storage !== 'undefined' ? localStorage.getItem("token") : null;
    const response = await api.get("/parking-spots/my-spots", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};