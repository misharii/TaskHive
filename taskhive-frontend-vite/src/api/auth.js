// src/api/auth.js
import api from './api';

// Register a new user
export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register.php', userData);
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Login user
export const login = async (credentials) => {
    try {
        const response = await api.post('/auth/login.php', credentials);
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Logout user
export const logout = async () => {
    try {
        const response = await api.post('/auth/logout.php');
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Check if user is authenticated
export const checkAuth = async () => {
    try {
        // We'll use the tasks/statuses endpoint to check if user is logged in
        const response = await api.get('/tasks/statuses.php');
        return { isAuthenticated: true,
            data: response.data
        };
    } catch (error) {
        // Don't redirect automatically here, just return the status
        if (error.response && error.response.status === 401) {
            return { isAuthenticated: false };
        }
        throw error.response?.data || error;
    }
};