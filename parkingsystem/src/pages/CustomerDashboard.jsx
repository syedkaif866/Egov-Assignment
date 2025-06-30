// src/pages/CustomerDashboard.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { normalizeVehicleNumber } from '../utils/vehicle';
import ParkingGrid from '../components/ParkingGrid';


const CustomerDashboard = () => {
    const { user, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second for real-time duration display
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second for real-time display

        return () => clearInterval(timer);
    }, []);

    // Fetch the raw parking slots from the database
    const rawParkingSlots = useLiveQuery(() => db.parkingSlots.toArray());

    // Get customer's parking history - with error handling for database migration
    const customerParkingHistory = useLiveQuery(() => {
        try {
            return user ? db.parkingHistory.where('customerId').equals(user.id).toArray() : [];
        } catch (error) {
            console.warn('Parking history query failed (database may be migrating):', error);
            return [];
        }
    });

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

    // Calculate parking duration for the current slot
    const parkingDuration = useMemo(() => {
        if (!userCurrentSlot || !userCurrentSlot.entryTime) return null;
        
        const entryTime = new Date(userCurrentSlot.entryTime);
        const durationMs = currentTime - entryTime;
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return { hours, minutes, entryTime };
    }, [userCurrentSlot, currentTime]);

    // Combine customer's historical and current parking data
    const customerAllParkingData = useMemo(() => {
        const historicalData = customerParkingHistory || [];
        const activeData = userCurrentSlot ? [{
            id: `active-${userCurrentSlot.id}`,
            slotId: userCurrentSlot.id,
            slotNumber: userCurrentSlot.slotNumber,
            customerId: user?.id,
            vehicleNumber: userCurrentSlot.vehicleNumber,
            entryTime: userCurrentSlot.entryTime,
            exitTime: null,
            isActive: true
        }] : [];
        
        const allData = [...historicalData, ...activeData];
        
        // Sort by entry time (or exit time for completed sessions), newest first
        return allData.sort((a, b) => {
            const timeA = new Date(a.exitTime || a.entryTime || 0);
            const timeB = new Date(b.exitTime || b.entryTime || 0);
            return timeB - timeA;
        });
    }, [customerParkingHistory, userCurrentSlot, user]);

    // Calculate duration for any parking session
    const calculateDuration = (entryTime, exitTime) => {
        if (!entryTime) return 'N/A';
        
        const entry = new Date(entryTime);
        const exit = exitTime ? new Date(exitTime) : currentTime;
        const durationMs = exit - entry;
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    };

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
                        <p className="text-sm text-gray-500 mt-1">
                            Email: {user?.email}
                        </p>
                        {userCurrentSlot && parkingDuration && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-800 font-medium">
                                    🚗 Currently Parked
                                </p>
                                <p className="text-blue-700 text-sm mt-1">
                                    <strong>Slot:</strong> {userCurrentSlot.slotNumber} • <strong>Vehicle:</strong> {userCurrentSlot.vehicleNumber}
                                </p>
                                <p className="text-blue-700 text-sm">
                                    <strong>Entry Time:</strong> {parkingDuration.entryTime.toLocaleString()}
                                </p>
                                <p className="text-blue-700 text-sm">
                                    <strong>Duration:</strong> {parkingDuration.hours}h {parkingDuration.minutes}m
                                </p>
                            </div>
                        )}
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
                        Logout
                    </button>                </header>

                <main className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Parking Grid Section */}
                    <div className="xl:col-span-2">
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
                    </div>

                    {/* Customer Parking History Section */}
                    <div className="xl:col-span-1">
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                My Parking History ({customerAllParkingData.length} records)
                            </h2>
                            
                            <div className="max-h-96 overflow-y-auto">
                                {customerAllParkingData.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        No parking history available.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {customerAllParkingData.map((record) => (
                                            <div 
                                                key={record.id} 
                                                className={`p-3 rounded-lg border ${
                                                    record.isActive 
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-gray-50 border-gray-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            Slot {record.slotNumber}
                                                        </p>
                                                        <p className="text-sm text-gray-600 font-mono">
                                                            {record.vehicleNumber}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        record.isActive 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {record.isActive ? 'Active' : 'Completed'}
                                                    </span>
                                                </div>
                                                
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <p>
                                                        <strong>Entry:</strong> {' '}
                                                        {record.entryTime 
                                                            ? new Date(record.entryTime).toLocaleString() 
                                                            : 'N/A'
                                                        }
                                                    </p>
                                                    {!record.isActive && (
                                                        <p>
                                                            <strong>Exit:</strong> {' '}
                                                            {record.exitTime 
                                                                ? new Date(record.exitTime).toLocaleString() 
                                                                : 'N/A'
                                                            }
                                                        </p>
                                                    )}
                                                    <p>
                                                        <strong>Duration:</strong> {' '}
                                                        <span className={record.isActive ? 'text-green-600 font-medium' : ''}>
                                                            {calculateDuration(record.entryTime, record.exitTime)}
                                                            {record.isActive && ' (ongoing)'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerDashboard;