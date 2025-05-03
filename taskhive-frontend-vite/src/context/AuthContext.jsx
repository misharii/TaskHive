// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { login, register, logout, checkAuth } from '../api/auth';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on component mount
// Check if user is logged in on component mount
// Modify the useEffect in AuthContext.jsx
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                setLoading(true);
                const { isAuthenticated, data } = await checkAuth();

                if (isAuthenticated) {
                    console.log('Auth check response.data:', data);

                    // Look for user info in all possible locations
                    const userData = data?.data || data;
                    const username =
                        // Check for the special _username field
                        userData[0]?._username ||
                        // Look for the new meta.user structure
                        data?.meta?.user?.username ||
                        // Then try the previous locations
                        userData?.session?.username ||
                        userData?.user?.username ||
                        userData?.username ||
                        'User';

                    setUser({
                        isAuthenticated: true,
                        username: username,
                        user_id: data?.meta?.user?.user_id ||
                            userData?.user_id ||
                            userData?.user?.user_id ||
                            userData?.session?.user_id
                    });
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth check error:', err);
                setError('Failed to check authentication status');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuthentication();
    }, []);

    // Login handler
// Login handler
    const handleLogin = async (credentials) => {
        try {
            setLoading(true);
            setError(null);
            const response = await login(credentials);

            if (response.status === 'success') {
                // Debug the response to see its structure
                console.log('Login response:', response);

                // Make sure to explicitly extract username
                const username = response.data?.username || 'User';

                setUser({
                    isAuthenticated: true,
                    username: username,  // Set username explicitly
                    user_id: response.data?.user_id,
                    ...response.data     // Include any other user data
                });

                return { success: true };
            }
        } catch (err) {
            setError(err.message || 'Login failed');
            return { success: false, error: err.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    // Register handler
    const handleRegister = async (userData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await register(userData);

            if (response.status === 'success') {
                setUser({ isAuthenticated: true, ...response.data });
                return { success: true };
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
            return { success: false, error: err.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            setLoading(true);
            setError(null);
            await logout();
            setUser(null);
            return { success: true };
        } catch (err) {
            setError(err.message || 'Logout failed');
            return { success: false, error: err.message || 'Logout failed' };
        } finally {
            setLoading(false);
        }
    };

    // Create the context value
    const value = {
        user,
        loading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};