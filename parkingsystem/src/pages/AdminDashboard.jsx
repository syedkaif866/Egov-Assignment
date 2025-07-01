import React,{ useMemo }  from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import RegisterStaffForm from '../components/RegisterStaffForm';
import StaffList from '../components/StaffList';
import ParkingGrid from '../components/ParkingGrid';
import CustomerList from '../components/CustomerList';
import ParkingStats from '../components/ParkingStats';
import DeletedUsersList from '../components/DeletedUsersList';
import ParkingHistory from '../components/ParkingHistory';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { user } = useAuth();

     // --- QUERIES FOR DATA ---
    const staffMembers = useLiveQuery(() => db.users.where('role').equals('staff').toArray());
    const rawParkingSlots = useLiveQuery(() => db.parkingSlots.toArray());
    // --- NEW: Add a live query to get all customers ---
    const customers = useLiveQuery(() => db.users.where('role').equals('customer').toArray());
    // --- NEW: Add a live query to get deleted walk-in customers ---
    const deletedUsers = useLiveQuery(() => db.deletedusers.toArray());


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
                toast.error(`Error: A user with the email ${email} already exists.`);
                return;
            }
            const newStaff = { name, email, password, role: 'staff', vehicleNumber: `STAFF-${email}` };
            await db.users.add(newStaff);
            toast.success(`Staff member "${name}" registered successfully!`);
        } catch (error) {
            console.error("Failed to register staff:", error);
            toast.error(`Failed to register staff ${error}`);
        }
    };

    // --- NEW: Add functions to manage parking slots ---

    const handleAddSlot = async () => {
        try {
            // Get all existing slots and find the highest P-series number
            const allSlots = await db.parkingSlots.toArray();
            let maxPNumber = 0;
            
            // Find the highest P-series slot number
            allSlots.forEach(slot => {
                if (slot.slotNumber.startsWith('P')) {
                    const num = parseInt(slot.slotNumber.slice(1));
                    if (!isNaN(num) && num > maxPNumber) {
                        maxPNumber = num;
                    }
                }
            });
            
            // Generate the next P-series slot number
            const newSlotNumber = `P${maxPNumber + 1}`;
            
            // Double-check that this slot doesn't exist (extra safety)
            const existingSlot = await db.parkingSlots.where('slotNumber').equals(newSlotNumber).first();
            if (existingSlot) {
                toast.error(`Error: Slot ${newSlotNumber} already exists. Please use "Add Custom Slot" instead.`);
                return;
            }

            // Add the new slot to the database
            await db.parkingSlots.add({
                slotNumber: newSlotNumber,
                status: 'available',
                bookedByUserId: null,
                vehicleNumber: null,
                entryTime: null,
            });
            toast.success(`Slot ${newSlotNumber} added successfully!`);
        } catch (error) {
            console.error("Failed to add slot:", error);
            if (error.name === 'ConstraintError') {
                toast.error("Failed to add slot: A slot with this number already exists.");
            } else {
                toast.error(`Failed to add slot: ${error.message}`);
            }
        }
    };

    const handleAddCustomSlot = async () => {
        const slotNumber = prompt("Enter the slot number (e.g., P15, A1, B2):");
        
        if (!slotNumber) {
            return; // User cancelled
        }

        const trimmedSlotNumber = slotNumber.trim().toUpperCase();
        
        if (!trimmedSlotNumber) {
            toast.error("Please enter a valid slot number.");
            return;
        }

        try {
            const existingSlot = await db.parkingSlots.where('slotNumber').equals(trimmedSlotNumber).first();
            
            if (existingSlot) {
                toast.error(`Error: Slot number "${trimmedSlotNumber}" already exists.`);
                return;
            }

            // Add the new slot to the database
            await db.parkingSlots.add({
                slotNumber: trimmedSlotNumber,
                status: 'available',
                bookedByUserId: null,
                vehicleNumber: null,
                entryTime: null,
            });

            toast.success(`Slot ${trimmedSlotNumber} added successfully!`);
        } catch (error) {
            console.error("Failed to add custom slot:", error);
            if (error.name === 'ConstraintError') {
                toast.error(`Failed to add slot: Slot "${trimmedSlotNumber}" already exists.`);
            } else {
                toast.error(`Failed to add slot: ${error.message}`);
            }
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
                    toast.error("No slots to delete.");
                }
            } catch (error) {
                console.error("Failed to delete last slot:", error);
                toast.error("An error occurred while deleting the last slot.");
            }
        }
    };

    const handleToggleSlotStatus = async (id) => {
        const slotToToggle = await db.parkingSlots.get(id);
        if (slotToToggle && slotToToggle.status !== 'occupied') {
            try {
                const newStatus = slotToToggle.status === 'available' ? 'maintenance' : 'available';
                await db.parkingSlots.update(id, { status: newStatus });
                toast.success(`Slot status changed to ${newStatus}.`);
            } catch (error) {
                console.error("Failed to toggle slot status:", error);
                toast.error("An error occurred while toggling the slot status.");
            }
        } else {
            toast.error("You can't change the status of an occupied slot.");
        }
    };

    // This function is for the 'X' on each individual slot
    const handleDeleteSlot = async (id) => {
        if (window.confirm("Are you sure you want to delete this specific slot?")) {
            const slotToDelete = await db.parkingSlots.get(id);
            if (slotToDelete && (slotToDelete.status === 'available'|| slotToDelete.status === 'maintenance')) {
                try {
                    await db.parkingSlots.delete(id);
                } catch (error) {
                    console.error("Failed to delete slot:", error);
                    toast.error("An error occurred while deleting the slot.");
                }
            } else {
                toast.error("You can't delete an occupied slot. Please free it first.");
            }
        }
    };


     const handleDeleteStaff = async (staffId) => {
        if (window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
            try {
                await db.users.delete(staffId);
                toast.success("Staff member deleted successfully.");
            } catch (error) {
                console.error("Failed to delete staff member:", error);
                toast.error("An error occurred while deleting the staff member.");
            }
        }
    };

    // --- NEW: Function to delete a customer ---
    const handleDeleteCustomer = async (customerId) => {
        // Check if the customer has an active booking and handle it.
        if (window.confirm("Are you sure you want to delete this customer? This will also free up any parking slots they have booked. This action cannot be undone.")) {
            try {
                // Get customer information before deletion
                const customer = await db.users.get(customerId);
                
                // 1. First, find and free any slots booked by this customer
                const customerSlots = await db.parkingSlots.where('bookedByUserId').equals(customerId).toArray();
                
                if (customerSlots.length > 0) {
                    // Free up all slots booked by this customer
                    for (const slot of customerSlots) {
                        // Add to parking history if there was an active booking
                        if (slot.entryTime) {
                            await db.parkingHistory.add({
                                slotId: slot.id,
                                slotNumber: slot.slotNumber,
                                customerId: customerId,
                                vehicleNumber: slot.vehicleNumber,
                                entryTime: slot.entryTime,
                                exitTime: new Date(),
                            });
                        }
                        
                        await db.parkingSlots.update(slot.id, {
                            status: 'available',
                            bookedByUserId: null,
                            vehicleNumber: null,
                            entryTime: null,
                        });
                    }
                    console.log(`Freed ${customerSlots.length} parking slot(s) that were booked by the deleted customer.`);
                }

                // 2. Move customer to deletedusers table (for both walk-in and registered customers)
                if (customer) {
                    await db.deletedusers.add({
                        originalId: customer.id,
                        name: customer.name,
                        email: customer.email,
                        vehicleNumber: customer.vehicleNumber,
                        mobileNumber: customer.mobileNumber,
                        customerType: customer.customerType,
                        deletedAt: new Date(),
                        deletedBy: user?.name || 'Admin',
                    });
                    console.log(`${customer.customerType} customer ${customer.name} moved to deleted users table by admin`);
                }

                // 3. Delete the customer from users table
                await db.users.delete(customerId);
                
                const deletionMessage = `Customer deleted and moved to deleted users archive!`;
                
                if (customerSlots.length > 0) {
                    toast.success(`${deletionMessage} ${customerSlots.length} parking slot(s) have been freed up.`);
                } else {
                    toast.success(deletionMessage);
                }
            } catch (error) {
                console.error("Failed to delete customer:", error);
                toast.error("An error occurred while deleting the customer.");
            }
        }
    };

    // --- NEW: Update the JSX with a new layout and components ---
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Increased max-width for a better layout */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome, {user?.name}!</p>
                    </div>
                </header>

                {/* Parking Statistics Cards */}
                <ParkingStats slots={sortedParkingSlots} />

                {/* New layout for better organization */}
                <main className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    
                    {/* Parking Grid and History Section (takes up 3/4 of the width on extra large screens) */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Parking Grid */}
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Parking Layout</h2>
                                <div className="space-x-2">
                                    <button onClick={handleAddSlot} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Add Next Slot</button>
                                    <button onClick={handleAddCustomSlot} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Add Custom Slot</button>
                                    <button onClick={handleDeleteLastSlot} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Delete Last</button>
                                </div>
                            </div>
                            <ParkingGrid 
                                slots={sortedParkingSlots}
                                isAdmin={true}
                                userRole="admin"
                                onDeleteSlot={handleDeleteSlot}
                               onToggleStatus={handleToggleSlotStatus}
                            />
                        </div>
                        
                        {/* Parking History */}
                        <ParkingHistory />
                    </div>

                    {/* Admin Management Section (takes up 1/4 of the width on extra large screens) */}
                    <div className="xl:col-span-1 space-y-6">
                        <RegisterStaffForm onRegisterStaff={handleRegisterStaff} />
                        {/* Pass the delete handler to the StaffList component */}
                        <StaffList staffMembers={staffMembers} onDeleteStaff={handleDeleteStaff} />
                        {/* --- NEW: Add the CustomerList to the UI --- */}
                        <CustomerList customers={customers} onDeleteCustomer={handleDeleteCustomer} />
                        {/* --- NEW: Add the DeletedUsersList to show deleted walk-in customers --- */}
                        <DeletedUsersList deletedUsers={deletedUsers} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
