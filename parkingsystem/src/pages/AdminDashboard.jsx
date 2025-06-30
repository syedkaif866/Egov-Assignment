import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
            </div>
            <p className="mt-4">Welcome, {user?.name}! This is where you will manage staff and view all parking data.</p>
            {/* Admin-specific components will go here */}
        </div>
    );
};
export default AdminDashboard;