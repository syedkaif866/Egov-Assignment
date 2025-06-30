
// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from "../db/db"
import { useNavigate } from 'react-router-dom';
import { normalizeVehicleNumber } from '../utils/vehicle'; // <-- IMPORT THE UTILITY

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Persist user session on page reload
    useEffect(() => {
        const loggedInUser = sessionStorage.getItem('parkingUser');
        if (loggedInUser) {
            setUser(JSON.parse(loggedInUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const potentialUser = await db.users.where('email').equals(email).first();
        if (potentialUser && potentialUser.password === password) {
            setUser(potentialUser);
            sessionStorage.setItem('parkingUser', JSON.stringify(potentialUser));
            navigate('/dashboard');
        } else {
            alert('Invalid email or password!');
        }
    };

    const register = async (userData) => {
        // Basic validation
        if (!userData.name || !userData.email || !userData.password || !userData.vehicleNumber) {
            alert('All fields are required for customer registration!');
            return;
        }

        const normalizedVehicleNo = normalizeVehicleNumber(userData.vehicleNumber);
        if (!normalizedVehicleNo) {
            alert('Invalid vehicle number format. Please enter a valid vehicle number.');
            return;
        }

        try {
            // Check if user already exists
            const existingUser = await db.users.where('email').equals(userData.email).first();
            if (existingUser) {
                alert('User with this email already exists!');
                return;
            }

            // Check for existing vehicle
            const existingVehicle = await db.users.where('vehicleNumber').equals(normalizedVehicleNo).first();
            if (existingVehicle) {
                alert(`Error: Vehicle number "${userData.vehicleNumber}" is already registered.`);
                return;
            }

            const newUser = {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                vehicleNumber: normalizedVehicleNo, // <-- SAVE NORMALIZED VERSION
                role: 'customer',
                customerType: 'registered', // Set customer type on registration
                mobileNumber: null // Or you could add this field to the registration form
            };

            await db.users.add(newUser);

            alert('Registration successful! Please log in.');
            navigate('/login');

        } catch (error) {
            console.error("Registration failed:", error);
            alert(`Registration failed. Please check the console for details.`);
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('parkingUser');
        navigate('/login');
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
