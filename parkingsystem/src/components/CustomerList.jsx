import React from 'react';

const CustomerList = ({ customers, onDeleteCustomer }) => {
    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Manage Customers</h3>
            {customers && customers.length > 0 ? (
                <ul className="space-y-3">
                    {customers.map(customer => (
                        <li key={customer.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{customer.name}</p>
                                {customer.customerType === 'walk-in' ? (
                                    <>
                                        <p className="text-sm text-gray-500">Vehicle: <span className="font-mono">{customer.vehicleNumber}</span></p>
                                        <p className="text-xs text-gray-400 capitalize">{customer.customerType} Customer</p>
                                        <p className="text-xs text-gray-400">Registered by: <span className="font-mono">{customer.registeredBy || 'Unknown'}</span></p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-500">Email: <span className="font-mono">{customer.email}</span></p>
                                        <p className="text-xs text-gray-400 capitalize">{customer.customerType} Customer</p>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => onDeleteCustomer(customer.id)}
                                className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No customers found in the system.</p>
            )}
        </div>
    );
};

export default CustomerList;