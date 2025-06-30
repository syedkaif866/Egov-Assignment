import React from 'react';
import { useAuth } from '../context/AuthContext';

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Staff Dashboard</h1>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
            </div>
            <p className="mt-4">Welcome, {user?.name}! You can manage vehicle entries, exits, and walk-in customers here.</p>
            {/* Staff-specific components will go here */}
        </div>
    );
};
export default StaffDashboard;