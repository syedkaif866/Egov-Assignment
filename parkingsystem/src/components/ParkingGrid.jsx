import React from 'react';

// --- UPDATE 1: Add 'onSlotClick' and 'userRole' to the list of props for ParkingSlot ---
const ParkingSlot = ({ slot, isAdmin, userRole, onDelete, onSlotClick, onToggleStatus }) => {
    
    // --- UPDATE 2: Add hover styles and cursor for clickable slots ---
    const getSlotStyles = () => {
        const baseStyles = {
            available: 'bg-green-100 border-green-400 text-green-800',
            occupied: 'bg-red-100 border-red-400 text-red-800',
            maintenance: 'bg-yellow-100 border-yellow-400 text-yellow-800',
        };
        
        let styles = baseStyles[slot.status] || 'bg-gray-100 border-gray-400';
        
        // For customers (non-admin, non-staff), make maintenance slots appear more disabled
        if (userRole === 'customer' && slot.status === 'maintenance') {
            styles = 'bg-gray-200 border-gray-400 text-gray-500 opacity-60';
        }
        
        // Add hover and cursor styles for clickable slots
        if ((isAdmin && onToggleStatus) || onSlotClick) {
            if (slot.status === 'available') {
                styles += ' hover:bg-green-200 cursor-pointer';
            } else if (slot.status === 'maintenance' && (isAdmin || userRole === 'staff')) {
                // Only allow admin/staff to hover on maintenance slots
                styles += ' hover:bg-yellow-200 cursor-pointer';
            } else if (slot.status === 'occupied' && onSlotClick && (isAdmin || userRole === 'staff')) {
                // Only allow admin/staff to click on occupied slots for exit functionality
                styles += ' hover:bg-red-200 cursor-pointer';
            }
        }
        
        return styles;
    };

    // --- UPDATE 3: Create a handleClick function ---
    const handleClick = () => {
        // If it's an admin/staff with toggle functionality
        if (onToggleStatus && isAdmin) {
            onToggleStatus(slot.id);
        }
        // If onSlotClick is provided (for staff or customer functionality)
        else if (onSlotClick) {
            // For customers: only allow clicking on available slots (not maintenance or occupied)
            // For staff: allow clicking on available (book), occupied (exit), and maintenance (manage) slots
            if (isAdmin || userRole === 'staff') {
                // Admin/Staff can click on all slot types
                if (slot.status === 'available' || slot.status === 'occupied' || slot.status === 'maintenance') {
                    onSlotClick(slot);
                }
            } else {
                // Customers can only click on available slots
                if (slot.status === 'available') {
                    onSlotClick(slot);
                }
            }
        }
    };

    return (
        // --- UPDATE 4: Add the onClick handler to the main div ---
        <div
            onClick={handleClick}
            className={`p-4 border-2 rounded-lg shadow-md flex flex-col justify-between items-center relative transition-colors duration-200 ${getSlotStyles()}`}
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

// --- UPDATE 7: Add 'onSlotClick' and 'userRole' to the props for ParkingGrid ---
const ParkingGrid = ({ slots, isAdmin = false, userRole = 'customer', onDeleteSlot = () => {}, onSlotClick = null, onToggleStatus = null }) => {
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
                    userRole={userRole}
                    onDelete={onDeleteSlot}
                    // --- UPDATE 8: Pass the onSlotClick prop down to each ParkingSlot ---
                    onSlotClick={onSlotClick}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
};

export default ParkingGrid;
