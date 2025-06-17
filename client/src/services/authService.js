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
      console.log("Attempting login with:", { email }); // Debug line - don't log password

      const response = await api.post("/api/v1/users/login", {
        email,
        password,
      });

      console.log("Login response:", {
        status: response.status,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.data?.user,
      });

      const { token, data } = response.data;

      if (token) {
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

  /**
   * Logs out a user by removing auth data from localStorage
   */
  logout: async () => {
    try {
      await api.post("/api/v1/users/logout");
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error("Logout error:", error.response?.data || error.message);
      // Still remove items even if the API call fails
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      throw error;
    }
  },

  /**
   * Checks if a user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Gets the current user from localStorage
   * @returns {Object|null} - User object or null if not authenticated
   */
  getCurrentUser: () => {
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
