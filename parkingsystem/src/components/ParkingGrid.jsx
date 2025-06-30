// src/components/ParkingGrid.jsx
import React from 'react';

// --- UPDATE 1: Add 'onSlotClick' to the list of props for ParkingSlot ---
const ParkingSlot = ({ slot, isAdmin, onDelete, onSlotClick }) => {
    
    // --- UPDATE 2: Add hover styles and cursor for 'available' slots ---
    const statusStyles = {
        available: 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 cursor-pointer',
        occupied: 'bg-red-100 border-red-400 text-red-800',
        maintenance: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    };

    // --- UPDATE 3: Create a handleClick function ---
    const handleClick = () => {
        // Only trigger the click function if it exists AND the slot is available
        if (onSlotClick && slot.status === 'available') {
            onSlotClick(slot);
        }
    };

    return (
        // --- UPDATE 4: Add the onClick handler to the main div ---
        <div
            onClick={handleClick}
            className={`p-4 border-2 rounded-lg shadow-md flex flex-col justify-between items-center relative transition-colors duration-200 ${statusStyles[slot.status] || 'bg-gray-100 border-gray-400'}`}
        >
            <div className="text-2xl font-bold">{slot.slotNumber}</div>
            <div className="text-sm font-medium capitalize">{slot.status}</div>
            
            {/* --- UPDATE 5: Display the vehicle number on occupied slots --- */}
            {slot.status === 'occupied' && (
                <div className="text-xs font-mono mt-1 bg-black/10 px-2 py-0.5 rounded">
                    {slot.vehicleNumber}
                </div>
            )}
            
            {isAdmin && (
                <button
                    // --- UPDATE 6: Stop event propagation on the delete button ---
                    onClick={(e) => {
                        e.stopPropagation(); // Prevents the div's onClick from firing
                        onDelete(slot.id);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                    aria-label={`Delete slot ${slot.slotNumber}`}
                >
                    X
                </button>
            )}
        </div>
    );
};

// --- UPDATE 7: Add 'onSlotClick' to the props for ParkingGrid ---
const ParkingGrid = ({ slots, isAdmin = false, onDeleteSlot = () => {}, onSlotClick = null }) => {
    if (!slots) {
        return <div className="text-center p-8">Loading parking slots...</div>;
    }

    if (slots.length === 0) {
        // Updated text for non-admin users
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-md mt-6">
                <h3 className="text-xl font-semibold">No Parking Slots Found</h3>
                {isAdmin ? (
                    <p className="text-gray-500 mt-2">Click "Add New Slot" to get started.</p>
                ) : (
                    <p className="text-gray-500 mt-2">The parking area has not been configured yet. Please check back later.</p>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
            {slots.map(slot => (
                <ParkingSlot 
                    key={slot.id} 
                    slot={slot} 
                    isAdmin={isAdmin} 
                    onDelete={onDeleteSlot}
                    // --- UPDATE 8: Pass the onSlotClick prop down to each ParkingSlot ---
                    onSlotClick={onSlotClick}
                />
            ))}
        </div>
    );
};

export default ParkingGrid;