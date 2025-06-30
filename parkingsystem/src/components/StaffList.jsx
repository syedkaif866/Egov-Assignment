// src/components/StaffList.jsx
import React from 'react';

const StaffList = ({ staffMembers }) => {
    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Current Staff Members</h3>
            {staffMembers && staffMembers.length > 0 ? (
                <ul className="space-y-3">
                    {staffMembers.map(staff => (
                        <li key={staff.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{staff.name}</p>
                                <p className="text-sm text-gray-500">{staff.email}</p>
                            </div>
                            {/* You can add a 'Delete' button here in the future */}
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