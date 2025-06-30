// src/pages/CustomerDashboard.jsx
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { normalizeVehicleNumber } from '../utils/vehicle';
import ParkingGrid from '../components/ParkingGrid';
import ParkingStats from '../components/ParkingStats';

const CustomerDashboard = () => {
    const { user, logout } = useAuth();

    // Fetch the raw parking slots from the database
    const rawParkingSlots = useLiveQuery(() => db.parkingSlots.toArray());

    // Sort the slots alphanumerically (so P10 comes after P9)
    const sortedParkingSlots = useMemo(() => {
        if (!rawParkingSlots) return [];
        return [...rawParkingSlots].sort((a, b) => {
            const numA = parseInt(a.slotNumber.replace(/[^0-9]/g, ''), 10);
            const numB = parseInt(b.slotNumber.replace(/[^0-9]/g, ''), 10);
            return numA - numB;
        });
    }, [rawParkingSlots]);

    // Find user's current parking slot
    const userCurrentSlot = useMemo(() => {
        if (!sortedParkingSlots || !user) return null;
        return sortedParkingSlots.find(slot => slot.bookedByUserId === user.id);
    }, [sortedParkingSlots, user]);

    // --- NEW: Function to handle booking a slot ---
    const handleBookSlot = async (slotToBook) => {
        if (!user) return; // Should not happen, but a good check

        try {
            // 1. Check if the user already has a booked slot
            const userHasBooking = sortedParkingSlots.some(
                (slot) => slot.bookedByUserId === user.id
            );
            if (userHasBooking) {
                alert("You already have an active parking booking. You can only book one slot at a time.");
                return;
            }

            // 2. Prompt for vehicle number
            const vehicleNumber = prompt("Please enter your vehicle number:");
            if (!vehicleNumber) {
                return; // User cancelled
            }

            // 3. Validate and normalize vehicle number
            const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);
            if (!normalizedVehicleNumber) {
                alert('Invalid vehicle number format. Please enter a valid vehicle number.');
                return;
            }

            // 4. Check if vehicle is already parked or registered
            const vehicleAlreadyParked = sortedParkingSlots.some(
                (slot) => slot.status === 'occupied' && slot.vehicleNumber === normalizedVehicleNumber
            );
            if (vehicleAlreadyParked) {
                alert(`Vehicle ${vehicleNumber} is already parked in the system.`);
                return;
            }

            // 5. Check if vehicle is registered as a walk-in customer
            const existingWalkInVehicle = await db.users.where('vehicleNumber').equals(normalizedVehicleNumber).first();
            if (existingWalkInVehicle && existingWalkInVehicle.customerType === 'walk-in') {
                alert(`Vehicle ${vehicleNumber} is already registered as a walk-in customer. Please contact staff for assistance.`);
                return;
            }

            // 6. Confirmation dialog
            if (!window.confirm(`Are you sure you want to book slot ${slotToBook.slotNumber} for vehicle ${vehicleNumber}?`)) {
                return;
            }

            // 7. Update the database
            await db.parkingSlots.update(slotToBook.id, {
                status: 'occupied',
                bookedByUserId: user.id,
                vehicleNumber: normalizedVehicleNumber,
                entryTime: new Date(), // Record the time of entry
            });

            alert(`Slot ${slotToBook.slotNumber} booked successfully for vehicle ${vehicleNumber}!`);
        } catch (error) {
            console.error("Failed to book slot:", error);
            alert("There was an error booking the slot. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Customer Dashboard</h1>
                        <p className="text-gray-600 mt-1">
                            Welcome, {user?.name}!
                        </p>
                        {userCurrentSlot && (
                            <p className="text-blue-600 mt-1 font-medium">
                                Currently parked: Slot {userCurrentSlot.slotNumber} • Vehicle: {userCurrentSlot.vehicleNumber}
                            </p>
                        )}
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
                        Logout
                    </button>
                </header>

                {/* Parking Statistics Cards */}
                <ParkingStats slots={sortedParkingSlots} />

                <main>
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Book a Parking Slot</h2>
                        <p className="text-gray-600">
                            {userCurrentSlot 
                                ? `You have an active booking in slot ${userCurrentSlot.slotNumber}. To book a different slot, please exit your current slot first through staff assistance.`
                                : "Click on any available (green) slot to book it. You'll be prompted to enter your vehicle number."
                            }
                        </p>
                        
                        <ParkingGrid 
                            slots={sortedParkingSlots} 
                            onSlotClick={handleBookSlot} // Pass the booking function to the grid
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerDashboard;