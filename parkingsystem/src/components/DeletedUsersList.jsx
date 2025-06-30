// src/components/DeletedUsersList.jsx
import React from 'react';

const DeletedUsersList = ({ deletedUsers }) => {
    if (!deletedUsers || deletedUsers.length === 0) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Deleted Walk-in Customers</h2>
                <p className="text-gray-500">No deleted walk-in customers found.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Deleted Walk-in Customers ({deletedUsers.length})
            </h2>
            <p className="text-gray-600 text-sm mb-4">
                Archive of walk-in customers who have completed their parking and exited the system
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {deletedUsers.map((user) => (
                    <div key={user.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-1 gap-1 text-sm">
                            <div className="font-semibold text-gray-800">{user.name}</div>
                            <div className="text-gray-600">Vehicle: {user.vehicleNumber}</div>
                            <div className="text-gray-600">Mobile: {user.mobileNumber}</div>
                            <div className="text-gray-500 text-xs">
                                Deleted: {new Date(user.deletedAt).toLocaleString()}
                            </div>
                            {user.deletedBy && (
                                <div className="text-gray-500 text-xs">
                                    Deleted by: {user.deletedBy}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeletedUsersList;
