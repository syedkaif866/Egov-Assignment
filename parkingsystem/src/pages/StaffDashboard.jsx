// src/pages/StaffDashboard.jsx
import React ,{ useMemo }from 'react';
import { useAuth } from '../context/AuthContext';
import WalkInRegistrationForm from '../components/WalkInRegistrationForm';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { normalizeVehicleNumber } from '../utils/vehicle'; // --- 3. IMPORT normalization function ---
import ParkingGrid from '../components/ParkingGrid';

// A new component to show the list of walk-ins
const WalkInCustomerList = ({ customers }) => {
    if (!customers || customers.length === 0) {
        return <p className="text-gray-500 mt-4">No walk-in customers registered yet.</p>;
    }

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Today's Walk-in Customers</h3>
            <ul className="space-y-2">
                {customers.map(customer => (
                    <li key={customer.id} className="p-2 bg-gray-50 rounded">
                        Vehicle: <span className="font-mono">{customer.vehicleNumber}</span> | 
                        Mobile: <span className="font-mono">{customer.mobileNumber}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// const StaffDashboard = () => {

//     const { user, logout } = useAuth();

//     // Live query to show all walk-in customers
//     const walkInCustomers = useLiveQuery(
//         () => db.users.where('customerType').equals('walk-in').toArray()
//     );

//     const handleRegisterWalkIn = async ({ vehicleNumber, mobileNumber }) => {
//         try {
//             // 1. CHECK FOR EXISTING VEHICLE (Case-Insensitive)
//             const existingVehicle = await db.users.where('vehicleNumber').equalsIgnoreCase(vehicleNumber).first();

//             if (existingVehicle) {
//                 alert(`Error: Vehicle number "${vehicleNumber}" is already registered to another user.`);
//                 return; // Stop the process
//             }

//             // 2. CREATE THE WALK-IN USER RECORD
//             const newUser = {
//                 // We generate a fake but unique email to satisfy the schema's unique index
//                 email: `walkin-${Date.now()}@parking.system`,
//                 name: `Walk-in (${vehicleNumber})`,
//                 password: null, // No password for walk-ins
//                 role: 'customer',
//                 customerType: 'walk-in', // This is the key identifier
//                 vehicleNumber: vehicleNumber,
//                 mobileNumber: mobileNumber,
//             };

//             // 3. ADD TO DATABASE
//             await db.users.add(newUser);
//             alert(`Walk-in customer with vehicle "${vehicleNumber}" registered successfully!`);
//             // The WalkInCustomerList will update automatically thanks to useLiveQuery!

//         } catch (error) {
//             console.error("Failed to register walk-in customer:", error);
//             alert("Registration failed. See console for details.");
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
//             <div className="max-w-4xl mx-auto">
//                 <header className="flex justify-between items-center mb-8">
//                     <div>
//                         <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
//                         <p className="text-gray-600 mt-1">Welcome, {user?.name}!</p>
//                     </div>
//                     <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
//                         Logout
//                     </button>
//                 </header>

//                 <main>
//                     <WalkInRegistrationForm onRegisterWalkIn={handleRegisterWalkIn} />
//                     <WalkInCustomerList customers={walkInCustomers} />
//                     {/* Parking Slot View will go here later */}
//                 </main>
//             </div>
//         </div>
//     );
// };

// export default StaffDashboard;



const StaffDashboard = () => {
    const { user, logout } = useAuth();

    // --- 5. FETCH AND SORT PARKING SLOTS (same logic as AdminDashboard) ---
    const rawParkingSlots = useLiveQuery(() => db.parkingSlots.toArray());

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
            alert('Invalid vehicle number format. Please enter a valid vehicle number.');
            return;
        }

        try {
            const existingVehicle = await db.users.where('vehicleNumber').equals(normalizedVehicleNo).first();
            if (existingVehicle) {
                alert(`Error: Vehicle number "${vehicleNumber}" is already registered.`);
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
            };

            await db.users.add(newUser);
            alert(`Walk-in customer with vehicle "${normalizedVehicleNo}" registered successfully!`);
        } catch (error) {
            console.error("Failed to register walk-in customer:", error);
            alert("Registration failed. See console for details.");
        }
    };


    // --- 7. UPDATE the JSX to the new two-column layout ---
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome, {user?.name}!</p>
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
                        Logout
                    </button>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Parking Grid Section */}
                    <div className="lg:col-span-2">
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Parking Availability</h2>
                            {/* Render the grid in read-only mode, passing the sorted list */}
                            <ParkingGrid slots={sortedParkingSlots} />
                        </div>
                    </div>

                    {/* Staff Actions Section */}
                    <div className="lg:col-span-1">
                        <WalkInRegistrationForm onRegisterWalkIn={handleRegisterWalkIn} />
                        {/* We can re-add the WalkInCustomerList here if needed */}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StaffDashboard;