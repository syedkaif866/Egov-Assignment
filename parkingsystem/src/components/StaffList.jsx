// src/components/StaffList.jsx
import React from 'react';

// Add 'onDeleteStaff' to the props
const StaffList = ({ staffMembers, onDeleteStaff }) => {
    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Manage Staff</h3>
            {staffMembers && staffMembers.length > 0 ? (
                <ul className="space-y-3">
                    {staffMembers.map(staff => (
                        <li key={staff.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{staff.name}</p>
                                <p className="text-sm text-gray-500">{staff.email}</p>
                            </div>
                            {/* Add a delete button that calls the passed-in function */}
                            <button
                                onClick={() => onDeleteStaff(staff.id)}
                                className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No staff members have been registered yet.</p>
            )}
        </div>
    );
};

export default StaffList;