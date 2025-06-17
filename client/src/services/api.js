import axios from "../axios";

// API routes
export const API_ROUTES = {
  auth: {
    login: "/api/v1/users/login",
    register: "/api/v1/users/register",
    logout: "/api/v1/users/logout",
    resetPassword: "/api/v1/users/reset-password",
    forgotPassword: "/api/v1/users/forgot-password"
  },
  users: {
    profile: "/api/v1/users/me",
    preferences: "/api/v1/users/preferences"
  },
  parkingSpots: {
    list: "/api/v1/parking-spots",
    mySpots: "/api/v1/parking-spots/my-spots",
    search: "/api/v1/parking-spots/search"
  },
  bookings: {
    create: "/api/v1/bookings",
    myBookings: "/api/v1/bookings/user/my-bookings",
    cancel: (id) => `/api/v1/bookings/${id}`
  }
};

// Add a request interceptor to handle auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
