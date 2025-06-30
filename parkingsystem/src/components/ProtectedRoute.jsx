// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useAuth();

    if (!user) {
        // User not logged in
        return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // User does not have the required role
        // You can redirect to a "Not Authorized" page or back to their own dashboard
        return <Navigate to="/" />; 
    }

    return children;
};

export default ProtectedRoute;