import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from "../db/db"
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Persist user session on page reload
    useEffect(() => {
        try {
            const loggedInUser = sessionStorage.getItem('parkingUser');
            if (loggedInUser) {
                const parsedUser = JSON.parse(loggedInUser);
                setUser(parsedUser);
            }
        } catch (error) {
            console.error("Failed to parse user from sessionStorage:", error);
            sessionStorage.removeItem('parkingUser'); // Clear corrupted data
        }
        setLoading(false);
    }, []);

    // --- 2. UPDATE THE LOGIN FUNCTION WITH ROLE-BASED REDIRECTION ---
    const login = async (email, password) => {
        const potentialUser = await db.users.where('email').equals(email).first();
        
        if (potentialUser && potentialUser.password === password) {
            setUser(potentialUser);
            sessionStorage.setItem('parkingUser', JSON.stringify(potentialUser));
            
            // This is the critical change: Redirect based on the user's role
            switch(potentialUser.role) {
                case 'admin':
                    navigate('/admin/dashboard');
                    toast.success('Welcome Admin!');
                    break;
                case 'staff':
                    navigate('/staff/dashboard');
                    toast.success('Welcome Staff!');
                    break;
                case 'customer':
                    navigate('/customer/dashboard');
                    toast.success('Welcome Customer!');
                    break;
                default:
                    
                    navigate('/home'); 
            }
            return true; // Return true on success
        }
        
       
        toast.error('Invalid email or password!');
        return false; 
    };

    const register = async (userData) => {
        // Basic validation
        if (!userData.name || !userData.email || !userData.password) {
            toast.error('Name, email, and password are required for customer registration!');
            return;
        }

        try {
            // Check if user already exists
            const existingUser = await db.users.where('email').equals(userData.email).first();
            if (existingUser) {
                toast.error('User with this email already exists!');
                return;
            }

            const newUser = {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                vehicleNumber: null, // No vehicle number stored for registered users
                role: 'customer',
                customerType: 'registered', // Set customer type on registration
                mobileNumber: null // Or you could add this field to the registration form
            };

            await db.users.add(newUser);

            toast.success('Registration successful! Please log in.');
            navigate('/login');

        } catch (error) {
            console.error("Registration failed:", error);
            toast.error(`Registration failed. Please check the console for details.`);
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
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
