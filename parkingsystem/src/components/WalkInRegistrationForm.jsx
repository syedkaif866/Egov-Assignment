import React, { useState } from 'react';

/**
 * A form for staff to register walk-in customers.
 * It takes one prop:
 * @param {function} onRegisterWalkIn - A function that will be called with the customer data when the form is submitted.
 */
const WalkInRegistrationForm = ({ onRegisterWalkIn }) => {
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    const handleSubmit = (e) => {
        // Prevent the browser from reloading the page
        e.preventDefault();

        // Basic validation to ensure fields are not empty
        if (!vehicleNumber || !mobileNumber) {
            alert('Please provide both vehicle and mobile number.');
            return; // Stop the function if validation fails
        }

        // Call the function passed down from the parent component (StaffDashboard)
        // Pass the data as an object
        onRegisterWalkIn({ vehicleNumber, mobileNumber });

        // Clear the form fields for the next entry
        setVehicleNumber('');
        setMobileNumber('');
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Register Walk-in Customer</h3>
            
            {/* The form element triggers the handleSubmit function on submission */}
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Vehicle Number Input */}
                <div>
                    <label className="block text-gray-700 mb-1 font-medium" htmlFor="walkin-vehicle">
                        Vehicle Number
                    </label>
                    <input
                        type="text"
                        id="walkin-vehicle"
                        value={vehicleNumber}
                        // We use .toUpperCase() to provide immediate feedback to the staff
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        placeholder="e.g., KA 01 AB 1234"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                </div>

                {/* Mobile Number Input */}
                <div>
                    <label className="block text-gray-700 mb-1 font-medium" htmlFor="walkin-mobile">
                        Mobile Number
                    </label>
                    <input
                        type="tel" // "tel" type is better for phone numbers (shows numeric keypad on mobile)
                        id="walkin-mobile"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="e.g., 9876543210"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                </div>
                
                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 ease-in-out shadow-sm"
                >
                    Register Customer
                </button>
            </form>
        </div>
    );
};

export default WalkInRegistrationForm;