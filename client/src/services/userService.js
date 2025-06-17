import api from "./api";

export const userService = {
  signup: async (requestData) => {
    try {
      const response = await api.post("/api/v1/users", requestData);
      return response.data;
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get("/api/v1/users");
      return response.data;
    } catch (error) {
      console.error("Get users error:", error.response?.data || error.message);
      throw error;
    }
  },

  getUser: async (userId) => {
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Get user error:", error.response?.data || error.message);
      throw error;
    }
  },

  updateUser: async (userId, requestData) => {
    try {
      const response = await api.patch(`/api/v1/users/${userId}`, requestData);
      return response.data;
    } catch (error) {
      console.error(
        "Update user error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/api/v1/users/${userId}`);
    return response.data;
  },

  login: async ({ email, password }) => {
    const response = await api.post("/api/v1/users/login", { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  updateMe: async (updatedData) => {
    const response = await api.patch("/users/updateMe", updatedData);
    return response.data;
  },

  updatePassword: async (passwordData) => {
    const response = await api.patch("/users/updateMyPassword", passwordData);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  getMySpots: async () => {
    const token = localStorage.getItem("token");
    const response = await api.get("/parking-spots/my-spots", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateParkingSpot: async (spotId, requestData) => {
    const token = localStorage.getItem("token");
    const response = await api.patch(`/parking-spots/${spotId}`, requestData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
