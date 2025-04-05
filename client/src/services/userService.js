import api from "./api";

export const userService = {
  signup: async (requestData) => {
    const response = await api.post("/users", requestData);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, requestData) => {
    const response = await api.put(`/users/${userId}`, requestData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  login: async ({ email, password }) => {
    const response = await api.post("/users/login", { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/users/me");
    console.log("getMe response:", response.data);
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
}

};
