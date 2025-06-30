// src/components/RegisterStaffForm.jsx
import React, { useState } from 'react';

const RegisterStaffForm = ({ onRegisterStaff }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            alert('Please fill out all fields.');
            return;
        }
        // Pass the data up to the parent component (AdminDashboard)
        onRegisterStaff({ name, email, password });
        // Reset form fields
        setName('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Register New Staff</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="staff-name">Staff Name</label>
                    <input
                        type="text"
                        id="staff-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="staff-email">Staff Email</label>
                    <input
                        type="email"
                        id="staff-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="staff-password">Password</label>
                    <input
                        type="password"
                        id="staff-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200">
                    Register Staff
                </button>
            </form>
        </div>
    );
};

export default RegisterStaffForm;