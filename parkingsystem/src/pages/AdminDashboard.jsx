// src/pages/AdminDashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import RegisterStaffForm from '../components/RegisterStaffForm';
import StaffList from '../components/StaffList';

const AdminDashboard = () => {
    const { user, logout } = useAuth();

    // useLiveQuery is a real-time hook. It automatically updates when the data changes.
    const staffMembers = useLiveQuery(
        () => db.users.where('role').equals('staff').toArray()
    );

    const handleRegisterStaff = async (staffData) => {
        const { name, email, password } = staffData;

        try {
            // Check if a user with this email already exists
            const existingUser = await db.users.where('email').equals(email).first();
            if (existingUser) {
                alert(`Error: A user with the email ${email} already exists.`);
                return;
            }

            // Add the new staff member to the database
            const newStaff = {
                name,
                email,
                password, // Remember: In a real app, hash this!
                role: 'staff',
                // We need a unique vehicleNumber due to the schema index.
                // We can use a placeholder.
                vehicleNumber: `STAFF-${email}`, 
            };

            await db.users.add(newStaff);
            alert(`Staff member "${name}" registered successfully!`);

        } catch (error) {
            console.error("Failed to register staff:", error);
            alert("Failed to register staff. See console for details.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome, {user?.name}!</p>
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
                        Logout
                    </button>
                </header>

                <main>
                    {/* The component for registering staff */}
                    <RegisterStaffForm onRegisterStaff={handleRegisterStaff} />
                    
                    {/* The component for listing staff */}
                    {/* We add a simple loading state check */}
                    {staffMembers ? (
                        <StaffList staffMembers={staffMembers} />
                    ) : (
                        <p className="text-center mt-8">Loading staff list...</p>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;