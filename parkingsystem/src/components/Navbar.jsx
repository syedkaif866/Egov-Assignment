import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Don't show navbar if user is not logged in
    if (!user) return null;

    const handleLogout = () => {
        logout();
        setIsMobileMenuOpen(false);
        toast.success('Logged out successfully!');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const isActivePage = (path) => {
        return location.pathname === path;
    };

    // Get dashboard path based on user role
    const getDashboardPath = () => {
        return `/${user.role}/dashboard`;
    };

    return (
        <nav className="bg-white shadow-lg border-b-2 border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <Link to={getDashboardPath()} className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-800">ParkingSystem</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {/* Dashboard Link */}
                        <Link
                            to={getDashboardPath()}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                                isActivePage(getDashboardPath())
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                            }`}
                        >
                            {user.role === 'admin' ? 'Admin Dashboard' : 
                             user.role === 'staff' ? 'Staff Dashboard' : 
                             'My Dashboard'}
                        </Link>

                        {/* User Info */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                </div>
                            </div>
                            
                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMobileMenu}
                            className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 mt-2 pt-4 pb-4">
                        <div className="space-y-3">
                            {/* User Info */}
                            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                </div>
                            </div>

                            {/* Dashboard Link */}
                            <Link
                                to={getDashboardPath()}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition duration-200 ${
                                    isActivePage(getDashboardPath())
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                                }`}
                            >
                                {user.role === 'admin' ? 'Admin Dashboard' : 
                                 user.role === 'staff' ? 'Staff Dashboard' : 
                                 'My Dashboard'}
                            </Link>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-base font-medium transition duration-200 shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
