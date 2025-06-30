import React from 'react';
import { useAuth } from '../context/AuthContext';

const CustomerDashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Customer Dashboard</h1>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
            </div>
            <p className="mt-4">Welcome, {user?.name}! Your vehicle number is {user?.vehicleNumber}.</p>
            <p>Here you can view available parking slots and book one.</p>
            {/* Customer-specific components will go here */}
        </div>
    );
};
export default CustomerDashboard;