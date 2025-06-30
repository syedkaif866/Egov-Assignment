// src/pages/AdminDashboard.jsx
import React,{ useMemo }  from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import RegisterStaffForm from '../components/RegisterStaffForm';
import StaffList from '../components/StaffList';
import ParkingGrid from '../components/ParkingGrid';

const AdminDashboard = () => {
    const { user, logout } = useAuth();

    // This query for staff members is existing code
    const staffMembers = useLiveQuery(
        () => db.users.where('role').equals('staff').toArray()
    );

    // --- NEW: Add a live query to get all parking slots ---
    // We order them by 'slotNumber' to ensure a consistent display
   const rawParkingSlots = useLiveQuery(() => 
        db.parkingSlots.toArray()
    );

    // --- 3. CREATE a correctly sorted list using useMemo ---
    const sortedParkingSlots = useMemo(() => {
        // If data isn't loaded yet, return an empty array
        if (!rawParkingSlots) return [];

        // Sort the array based on the numeric part of the slot number
        return [...rawParkingSlots].sort((a, b) => {
            // Extracts the number from strings like "P1", "P10"
            const numA = parseInt(a.slotNumber.replace(/[^0-9]/g, ''), 10);
            const numB = parseInt(b.slotNumber.replace(/[^0-9]/g, ''), 10);
            
            // Compares the numbers (e.g., 10 vs 9) for correct sorting
            return numA - numB;
        });
    }, [rawParkingSlots]);

    // This function for registering staff is existing code
    const handleRegisterStaff = async (staffData) => {
        // ... (your existing code for registering staff)
        const { name, email, password } = staffData;
        try {
            const existingUser = await db.users.where('email').equals(email).first();
            if (existingUser) {
                alert(`Error: A user with the email ${email} already exists.`);
                return;
            }
            const newStaff = { name, email, password, role: 'staff', vehicleNumber: `STAFF-${email}` };
            await db.users.add(newStaff);
            alert(`Staff member "${name}" registered successfully!`);
        } catch (error) {
            console.error("Failed to register staff:", error);
            alert("Failed to register staff. See console for details.");
        }
    };

    // --- NEW: Add functions to manage parking slots ---

    const handleAddSlot = async () => {
        try {
            // Find the highest existing slot number to determine the next one
            const lastSlot = await db.parkingSlots.orderBy('id').last();
            let newSlotNumber = 'P1';
            
            if (lastSlot && lastSlot.slotNumber.startsWith('P')) {
                const lastNum = parseInt(lastSlot.slotNumber.slice(1));
                newSlotNumber = `P${lastNum + 1}`;
            }

            // Add the new slot to the database
            await db.parkingSlots.add({
                slotNumber: newSlotNumber,
                status: 'available',
                bookedByUserId: null,
                vehicleNumber: null,
                entryTime: null,
            });
        } catch (error) {
            console.error("Failed to add slot:", error);
            alert("Failed to add slot. It might already exist. Check console for details.");
        }
    };
    
    // This function is for the main "Delete Last" button
    const handleDeleteLastSlot = async () => {
        if (window.confirm("Are you sure you want to delete the last added slot?")) {
            try {
                const lastSlot = await db.parkingSlots.orderBy('id').last();
                if (lastSlot) {
                    await db.parkingSlots.delete(lastSlot.id);
                } else {
                    alert("No slots to delete.");
                }
            } catch (error) {
                console.error("Failed to delete last slot:", error);
            }
        }
    }

    // This function is for the 'X' on each individual slot
    const handleDeleteSlot = async (id) => {
        if (window.confirm("Are you sure you want to delete this specific slot?")) {
            try {
                await db.parkingSlots.delete(id);
            } catch (error) {
                console.error("Failed to delete slot:", error);
            }
        }
    };

    // --- NEW: Update the JSX with a new layout and components ---
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            {/* Increased max-width for a better layout */}
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome, {user?.name}!</p>
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
                        Logout
                    </button>
                </header>

                {/* New two-column layout for better organization */}
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Parking Grid Section (takes up 2/3 of the width on large screens) */}
                    <div className="lg:col-span-2">
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Parking Layout</h2>
                                <div className="space-x-2">
                                    <button onClick={handleAddSlot} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Add New Slot</button>
                                    <button onClick={handleDeleteLastSlot} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Delete Last</button>
                                </div>
                            </div>
                            <ParkingGrid 
                                slots={sortedParkingSlots}
                                isAdmin={true}
                                onDeleteSlot={handleDeleteSlot}
                            />
                        </div>
                    </div>

                    {/* Staff Management Section (takes up 1/3 of the width on large screens) */}
                    <div className="lg:col-span-1">
                        <RegisterStaffForm onRegisterStaff={handleRegisterStaff} />
                        <StaffList staffMembers={staffMembers} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
