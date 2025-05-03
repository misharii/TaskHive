// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
    // Check for saved theme preference or use system preference
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            return savedTheme;
        }

        // Check for system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    // Apply theme to document element
    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        // Save theme to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Toggle theme
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // Set specific theme
    const setThemeMode = (mode) => {
        if (mode === 'light' || mode === 'dark') {
            setTheme(mode);
        }
    };

    // Create the context value
    const value = {
        theme,
        toggleTheme,
        setTheme: setThemeMode,
        isDark: theme === 'dark',
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};