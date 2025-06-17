import axios from "axios";

console.log('API URL:', process.env.REACT_APP_API_URL); // Debug line

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://spotly-gsy6.onrender.com',
  withCredentials: false, // Temporarily disabled to test connection
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
instance.interceptors.request.use(
  (config) => {
    console.log('Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    console.log('Response Success:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.response.data?.message || error.message
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', {
        url: error.config?.url,
        message: 'No response received from server'
      });
    } else {
      // Something happened in setting up the request
      console.error('Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
