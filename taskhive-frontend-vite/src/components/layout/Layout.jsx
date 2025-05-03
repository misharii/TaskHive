// src/components/layout/Layout.jsx
import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            {/* Header with integrated navigation */}
            <Header />

            {/* Main Content Area - hiding scrollbars but keeping functionality */}
            <main className="flex-1 overflow-hidden">
                <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-auto scrollbar-hide">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;