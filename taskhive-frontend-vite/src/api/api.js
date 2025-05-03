// src/api/api.js
import axios from "axios";

// Create an Axios instance with default config
const api = axios.create({
  // baseURL: 'http://localhost/taskhive/api',
  baseURL: "https://api-taskhive.albuhairi.me/taskhive/api",

  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for session authentication
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(
      `API Request: ${config.method.toUpperCase()} ${config.url}`,
      config.data
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status}`, response.data);
    return response.data;
  },
  (error) => {
    console.error("API Error:", error.response || error);

    // Handle session timeouts or unauthorized access
    if (error.response && error.response.status === 401) {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
