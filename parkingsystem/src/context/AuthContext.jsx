// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from "../db/db"
import { useNavigate } from 'react-router-dom';

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
            sessionStorage.setItem('parkingUser', JSON.stringify(potentialUser)); // Use sessionStorage for persistence
            // Redirect based on role
            switch(potentialUser.role) {
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                case 'staff':
                    navigate('/staff/dashboard');
                    break;
                case 'customer':
                    navigate('/customer/dashboard');
                    break;
                default:
                    navigate('/');
            }
            return true;
        }
        alert('Invalid credentials');
        return false;
    };

    const register = async (userData) => {
        // Basic validation
        if (!userData.name || !userData.email || !userData.password || !userData.vehicleNumber) {
            alert('All fields are required for customer registration!');
            return;
        }

        try {
            // Check if user already exists
            const existingUser = await db.users.where('email').equals(userData.email).first();
            if (existingUser) {
                alert('User with this email already exists!');
                return; // Stop execution
            }

            // Check if vehicle number already exists
            const existingVehicle = await db.users.where('vehicleNumber').equals(userData.vehicleNumber).first();
            if (existingVehicle) {
                alert('User with this vehicle number already exists!');
                return; // Stop execution
            }


            // Create the new user object
            const newUser = {
                name: userData.name,
                email: userData.email,
                password: userData.password, // Remember: In a real app, hash this!
                vehicleNumber: userData.vehicleNumber,
                role: 'customer'
            };
            
            console.log("Attempting to add new user:", newUser);

            // Add to the database
            const id = await db.users.add(newUser);

            console.log(`User successfully added with ID: ${id}`);
            alert('Registration successful! Please log in.');
            navigate('/login');

        } catch (error) {
            // This block will catch any errors from the 'await' calls
            console.error("Registration failed:", error);
            alert(`Registration failed. Please check the console for details.`);
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('parkingUser');
        navigate('/login');
    };

    const value = { user, loading, login, logout, register };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};