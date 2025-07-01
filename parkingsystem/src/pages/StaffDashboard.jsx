import React ,{ useMemo }from 'react';
import { useAuth } from '../context/AuthContext';
import WalkInRegistrationForm from '../components/WalkInRegistrationForm';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { normalizeVehicleNumber } from '../utils/vehicle';
import ParkingGrid from '../components/ParkingGrid';
import ParkingStats from '../components/ParkingStats';
import ParkingHistory from '../components/ParkingHistory';
import Swal from 'sweetalert2';

// Initialize SweetAlert2 with React content
const MySwal = Swal.mixin({
    customClass: {
        confirmButton: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2',
        cancelButton: 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded'
    },
    buttonsStyling: false
});

// A new component to show the list of walk-ins
const WalkInCustomerList = ({ customers }) => {
    if (!customers || customers.length === 0) {
        return <p className="text-gray-500 mt-4">No walk-in customers registered yet.</p>;
    }

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Active Walk-in Customers</h3>
            <ul className="space-y-2">
                {customers.map(customer => (
                    <li key={customer.id} className="p-2 bg-gray-50 rounded">
                        Vehicle: <span className="font-mono">{customer.vehicleNumber}</span> | 
                        Mobile: <span className="font-mono">{customer.mobileNumber}</span>
                        Registered by: <span className="font-mono">{customer.registeredBy || 'Unknown'}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const StaffDashboard = () => {
    const { user } = useAuth();

    // --- 5. FETCH AND SORT PARKING SLOTS (same logic as AdminDashboard) ---
    const rawParkingSlots = useLiveQuery(() => db.parkingSlots.toArray());
    
    // Live query to show all walk-in customers
    const walkInCustomers = useLiveQuery(
        () => db.users.where('customerType').equals('walk-in').toArray()
    );

    const sortedParkingSlots = useMemo(() => {
        if (!rawParkingSlots) return [];
        return [...rawParkingSlots].sort((a, b) => {
            const numA = parseInt(a.slotNumber.replace(/[^0-9]/g, ''), 10);
            const numB = parseInt(b.slotNumber.replace(/[^0-9]/g, ''), 10);
            return numA - numB;
        });
    }, [rawParkingSlots]);

    // --- 6. UPDATE the registration logic to use normalization ---
    const handleRegisterWalkIn = async ({ vehicleNumber, mobileNumber }) => {
        const normalizedVehicleNo = normalizeVehicleNumber(vehicleNumber);

        if (!normalizedVehicleNo) {
            MySwal.fire({
                icon: 'error',
                title: 'Invalid Vehicle Number',
                text: 'Please enter a valid vehicle number format.',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            // Check if vehicle is already registered in users table (for walk-in customers)
            const existingVehicle = await db.users.where('vehicleNumber').equals(normalizedVehicleNo).first();
            if (existingVehicle) {
                MySwal.fire({
                    icon: 'error',
                    title: 'Vehicle Already Registered',
                    text: `Vehicle number "${vehicleNumber}" is already registered as a ${existingVehicle.customerType} customer.`,
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Check if vehicle is currently parked (by any registered or walk-in user)
            const currentlyParked = await db.parkingSlots.where('vehicleNumber').equals(normalizedVehicleNo).first();
            if (currentlyParked && currentlyParked.status === 'occupied') {
                MySwal.fire({
                    icon: 'error',
                    title: 'Vehicle Currently Parked',
                    text: `Vehicle number "${vehicleNumber}" is currently parked in slot ${currentlyParked.slotNumber}. Cannot register the same vehicle while it's already parked.`,
                    confirmButtonText: 'OK'
                });
                return;
            }

            const newUser = {
                email: `walkin-${Date.now()}@parking.system`,
                name: `Walk-in (${normalizedVehicleNo})`,
                password: null,
                role: 'customer',
                customerType: 'walk-in',
                vehicleNumber: normalizedVehicleNo,
                mobileNumber: mobileNumber,
                registeredBy: user.name,
            };

            await db.users.add(newUser);
            MySwal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: `Walk-in customer with vehicle "${normalizedVehicleNo}" registered successfully!`,
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error("Failed to register walk-in customer:", error);
            MySwal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: 'Registration failed. Please check the console for details.',
                confirmButtonText: 'OK'
            });
        }
    };

    // --- NEW: Function to handle slot click for staff operations ---
    const handleSlotClick = async (slot) => {
        if (slot.status === 'available') {
            // Staff can book this slot for a walk-in customer
            await handleBookSlotForWalkIn(slot);
        } else if (slot.status === 'occupied') {
            // Staff can exit/free this slot for any customer
            await handleExitSlot(slot);
        }
        else if (slot.status === 'maintenance') {
            // Staff can toggle maintenance status for this slot
            await handleMaintenanceSlot(slot);
        }
        // Staff cannot do anything with maintenance slots via click
    };

    // --- NEW: Function to book a slot for walk-in customer ---
    const handleBookSlotForWalkIn = async (slot) => {
        if (!walkInCustomers || walkInCustomers.length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'No Walk-in Customers',
                text: 'No walk-in customers available. Please register a walk-in customer first.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Create a list of available walk-in customers (those without active bookings)
        const availableWalkIns = [];
        for (const customer of walkInCustomers) {
            const hasActiveBooking = sortedParkingSlots.some(
                parkingSlot => parkingSlot.bookedByUserId === customer.id
            );
            if (!hasActiveBooking) {
                availableWalkIns.push(customer);
            }
        }

        if (availableWalkIns.length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'No Available Walk-in Customers',
                text: 'All walk-in customers already have active parking bookings.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Create a selection dialog
        let customerOptions = {};
        let customerListHtml = '<div class="text-left">';
        availableWalkIns.forEach((customer, index) => {
            customerOptions[index + 1] = `${customer.vehicleNumber} (${customer.mobileNumber})`;
            customerListHtml += `<div class="mb-2"><strong>${index + 1}.</strong> ${customer.vehicleNumber} (${customer.mobileNumber})</div>`;
        });
        customerListHtml += '</div>';

        const { value: choice } = await MySwal.fire({
            title: 'Select Walk-in Customer',
            html: customerListHtml + '<br><input type="number" id="customer-choice" class="swal2-input" placeholder="Enter customer number" min="1" max="' + availableWalkIns.length + '">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Select',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const choice = document.getElementById('customer-choice').value;
                if (!choice || choice < 1 || choice > availableWalkIns.length) {
                    MySwal.showValidationMessage('Please enter a valid customer number');
                    return false;
                }
                return choice;
            }
        });

        if (!choice) return; // User cancelled

        const customerIndex = parseInt(choice) - 1;
        const selectedCustomer = availableWalkIns[customerIndex];

        // Confirm the booking
        const confirmResult = await MySwal.fire({
            title: 'Confirm Booking',
            text: `Book slot ${slot.slotNumber} for vehicle ${selectedCustomer.vehicleNumber}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Book Slot',
            cancelButtonText: 'Cancel'
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        try {
            await db.parkingSlots.update(slot.id, {
                status: 'occupied',
                bookedByUserId: selectedCustomer.id,
                vehicleNumber: selectedCustomer.vehicleNumber,
                entryTime: new Date(),
            });

            MySwal.fire({
                icon: 'success',
                title: 'Slot Booked Successfully',
                text: `Slot ${slot.slotNumber} booked successfully for walk-in customer ${selectedCustomer.vehicleNumber}!`,
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error("Failed to book slot:", error);
            MySwal.fire({
                icon: 'error',
                title: 'Booking Failed',
                text: 'Failed to book slot. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    };

    // --- NEW: Function to exit/free a booked slot ---
    const handleExitSlot = async (slot) => {
        if (slot.status !== 'occupied') {
            MySwal.fire({
                icon: 'warning',
                title: 'Slot Not Occupied',
                text: 'This slot is not currently occupied.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Get customer information
        let customerInfo = 'Unknown Customer';
        let customerType = 'Unknown';
        let customer = null;
        if (slot.bookedByUserId) {
            try {
                customer = await db.users.get(slot.bookedByUserId);
                if (customer) {
                    customerType = customer.customerType === 'walk-in' ? 'Walk-in' : 'Registered';
                    customerInfo = `${customer.name} (${slot.vehicleNumber}) - ${customerType} Customer`;
                }
            } catch (error) {
                console.error("Failed to get customer info:", error);
            }
        }

        // Calculate parking duration
        let durationText = '';
        if (slot.entryTime) {
            const entryTime = new Date(slot.entryTime);
            const exitTime = new Date();
            const durationMs = exitTime - entryTime;
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            durationText = `\nParking Duration: ${durationHours}h ${durationMinutes}m`;
        }

        // Confirm the exit
        const exitConfirmResult = await MySwal.fire({
            title: 'Confirm Exit',
            html: `<div class="text-left">
                <p><strong>Free up slot ${slot.slotNumber}?</strong></p>
                <p><strong>Customer:</strong> ${customerInfo}</p>
                ${durationText ? `<p><strong>Duration:</strong> ${durationText.replace('\n', '')}</p>` : ''}
                <p class="mt-2">This will make the slot available for new bookings.</p>
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Free Slot',
            cancelButtonText: 'Cancel'
        });

        if (!exitConfirmResult.isConfirmed) {
            return;
        }

        try {
            // Add to parking history before clearing the slot
            if (slot.bookedByUserId && slot.entryTime) {
                await db.parkingHistory.add({
                    slotId: slot.id,
                    slotNumber: slot.slotNumber,
                    customerId: slot.bookedByUserId,
                    vehicleNumber: slot.vehicleNumber,
                    entryTime: slot.entryTime,
                    exitTime: new Date(),
                });
            }

            // If this is a walk-in customer, move them to deletedusers table and delete them
            // If this is a registered customer, just clear the slot (keep the user account)
            if (customer && customer.customerType === 'walk-in') {
                try {
                    // Add to deletedusers table
                    await db.deletedusers.add({
                        originalId: customer.id,
                        name: customer.name,
                        email: customer.email,
                        vehicleNumber: customer.vehicleNumber,
                        mobileNumber: customer.mobileNumber,
                        customerType: customer.customerType,
                        deletedAt: new Date(),
                        deletedBy: user?.name || 'Staff', // Track who deleted the customer
                    });

                    // Remove walk-in customer from users table
                    await db.users.delete(customer.id);
                    
                    console.log(`Walk-in customer ${customer.name} moved to deleted users table by ${user?.name}`);
                } catch (error) {
                    console.error("Failed to move walk-in customer to deleted users:", error);
                    // Continue with slot clearing even if this fails
                }
            }
            // For registered customers, we don't delete their account - just clear the slot

            // Clear the slot
            await db.parkingSlots.update(slot.id, {
                status: 'available',
                bookedByUserId: null,
                vehicleNumber: null,
                entryTime: null,
            });

            const exitMessage = customer && customer.customerType === 'walk-in' 
                ? `Slot ${slot.slotNumber} has been freed up successfully!${durationText}\n\nWalk-in customer ${customer.name} has been checked out and removed from the system.`
                : `Slot ${slot.slotNumber} has been freed up successfully!${durationText}\n\n${customer && customer.customerType === 'registered' ? `Registered customer ${customer.name} has been checked out. Their account remains active.` : ''}`;
            
            MySwal.fire({
                icon: 'success',
                title: 'Slot Freed Successfully',
                text: exitMessage,
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error("Failed to exit slot:", error);
            MySwal.fire({
                icon: 'error',
                title: 'Exit Failed',
                text: 'Failed to free up the slot. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    };

    // --- NEW: Function to handle maintenance slot operations ---
    const handleMaintenanceSlot = async (slot) => {
        if (slot.status !== 'maintenance') {
            MySwal.fire({
                icon: 'warning',
                title: 'Slot Not Under Maintenance',
                text: 'This slot is not currently under maintenance.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Create options for staff
        const { value: choice } = await MySwal.fire({
            title: 'Maintenance Slot Options',
            html: `
                <div class="text-left">
                    <p class="mb-3">What would you like to do with slot ${slot.slotNumber}?</p>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="radio" name="maintenance-option" value="1" class="mr-2"> 
                            Make slot available (remove maintenance status)
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="maintenance-option" value="2" class="mr-2"> 
                            Delete this slot permanently
                        </label>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const selected = document.querySelector('input[name="maintenance-option"]:checked');
                if (!selected) {
                    MySwal.showValidationMessage('Please select an option');
                    return false;
                }
                return selected.value;
            }
        });

        if (!choice) return; // User cancelled

        const selectedOption = parseInt(choice);

        if (selectedOption === 1) {
            // Make slot available
            const makeAvailableResult = await MySwal.fire({
                title: 'Make Slot Available',
                text: `Make slot ${slot.slotNumber} available for booking?\n\nThis will remove the maintenance status and allow customers to book this slot.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Make Available',
                cancelButtonText: 'Cancel'
            });

            if (makeAvailableResult.isConfirmed) {
                try {
                    await db.parkingSlots.update(slot.id, {
                        status: 'available',
                    });
                    MySwal.fire({
                        icon: 'success',
                        title: 'Slot Available',
                        text: `Slot ${slot.slotNumber} is now available for booking!`,
                        confirmButtonText: 'OK'
                    });
                } catch (error) {
                    console.error("Failed to update slot status:", error);
                    MySwal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: 'Failed to update slot status. Please try again.',
                        confirmButtonText: 'OK'
                    });
                }
            }
        } else if (selectedOption === 2) {
            // Delete slot permanently
            const deleteResult = await MySwal.fire({
                title: 'Delete Slot Permanently',
                text: `Delete slot ${slot.slotNumber} permanently?\n\nThis action cannot be undone. The slot will be completely removed from the system.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete Permanently',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33'
            });

            if (deleteResult.isConfirmed) {
                try {
                    await db.parkingSlots.delete(slot.id);
                    MySwal.fire({
                        icon: 'success',
                        title: 'Slot Deleted',
                        text: `Slot ${slot.slotNumber} has been deleted permanently.`,
                        confirmButtonText: 'OK'
                    });
                } catch (error) {
                    console.error("Failed to delete slot:", error);
                    MySwal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: 'Failed to delete slot. Please try again.',
                        confirmButtonText: 'OK'
                    });
                }
            }
        } else {
            MySwal.fire({
                icon: 'error',
                title: 'Invalid Selection',
                text: 'Invalid selection. Please choose a valid option.',
                confirmButtonText: 'OK'
            });
        }
    };

    // --- 7. UPDATE the JSX to the new two-column layout ---
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome, {user?.name}!</p>
                    </div>
                </header>

                {/* Parking Statistics Cards */}
                <ParkingStats slots={sortedParkingSlots} />

                <main className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Parking Grid Section */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Parking Grid */}
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Parking Management</h2>
                            <p className="text-gray-600 mb-4">
                                Click on <span className="text-green-600 font-semibold">available slots</span> to book for walk-in customers • 
                                Click on <span className="text-red-600 font-semibold">occupied slots</span> to exit both regular and walk-in customers • 
                                Click on <span className="text-yellow-600 font-semibold">maintenance slots</span> to make available or delete
                            </p>
                            {/* Render the grid with interactive capabilities for staff */}
                            <ParkingGrid 
                                slots={sortedParkingSlots} 
                                onSlotClick={handleSlotClick}
                                isAdmin={false}
                                userRole="staff"
                            />
                        </div>
                        
                        {/* Parking History */}
                        <ParkingHistory />
                    </div>

                    {/* Staff Actions Section */}
                    <div className="xl:col-span-1 space-y-6">
                        <WalkInRegistrationForm onRegisterWalkIn={handleRegisterWalkIn} />
                        {/* Add the WalkInCustomerList to show registered walk-ins */}
                        <WalkInCustomerList customers={walkInCustomers} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StaffDashboard;