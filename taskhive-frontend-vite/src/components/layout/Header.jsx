// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiClipboard, FiList, FiLogOut } from 'react-icons/fi';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    console.log('User object:', user)

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <header className="sticky top-0 z-10 w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                <div className="w-full px-4 sm:px-6">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo and Brand */}
                        <div className="flex items-center">
                            <Link to="/dashboard" className="flex items-center">
                                <div className="flex items-center space-x-2">
                                    <img
                                        src="/TaskHiveLogo.png"
                                        alt="TaskHive Logo"
                                        className="h-8 w-auto"
                                    />
                                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                        TaskHive
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-1">
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`
                                }
                            >
                                <FiHome className="h-4 w-4 mr-1.5" />
                                Dashboard
                            </NavLink>

                            <NavLink
                                to="/tasks/kanban"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`
                                }
                            >
                                <FiClipboard className="h-4 w-4 mr-1.5" />
                                Kanban
                            </NavLink>

                            <NavLink
                                to="/tasks/list"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`
                                }
                            >
                                <FiList className="h-4 w-4 mr-1.5" />
                                Tasks
                            </NavLink>


                        </nav>

                        {/* Right section: User controls */}
                        <div className="flex items-center space-x-3">
                            {/* Theme Toggle */}
                            <ThemeToggle />



                            {/* User Info / Logout */}
                            {user ? (
                                <div className="hidden md:flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user?.username || user?.email || user?.name || 'User'}

                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        <FiLogOut className="h-4 w-4 mr-1.5" />
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="hidden md:flex items-center space-x-2">
                                    <Link
                                        to="/login"
                                        className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <button
                                onClick={toggleMenu}
                                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none"
                            >
                                {isMenuOpen ? (
                                    <FiX className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <FiMenu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`
                                }
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FiHome className="h-5 w-5 mr-2" />
                                Dashboard
                            </NavLink>

                            <NavLink
                                to="/tasks/kanban"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`
                                }
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FiClipboard className="h-5 w-5 mr-2" />
                                Kanban Board
                            </NavLink>

                            <NavLink
                                to="/tasks/list"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`
                                }
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FiList className="h-5 w-5 mr-2" />
                                Task List
                            </NavLink>


                        </div>

                        {/* Mobile User Actions */}
                        {user ? (
                            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center px-4 py-2">
                                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                        {user.username || 'User'}
                                    </div>
                                </div>
                                <div className="mt-3 px-2">
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                                    >
                                        <FiLogOut className="h-5 w-5 mr-2" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700 px-2">
                                <Link
                                    to="/login"
                                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center w-full px-3 py-2 mt-1 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Overlay for mobile menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </>
    );
};

export default Header;