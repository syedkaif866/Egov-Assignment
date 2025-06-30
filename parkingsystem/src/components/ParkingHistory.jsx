// src/components/ParkingHistory.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

const ParkingHistory = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('vehicle'); // 'vehicle' or 'customer'
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for real-time duration display
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Get all parking history
    const allParkingHistory = useLiveQuery(() => db.parkingHistory.toArray());
    
    // Get current active parking sessions (occupied slots)
    const activeSlots = useLiveQuery(() => db.parkingSlots.where('status').equals('occupied').toArray());
    
    // Get all users for customer name lookup
    const allUsers = useLiveQuery(() => db.users.toArray());
    
    // Get deleted users for name lookup
    const deletedUsers = useLiveQuery(() => db.deletedusers.toArray());

    // Combine historical and active parking data
    const allParkingData = React.useMemo(() => {
        const historicalData = allParkingHistory || [];
        const activeData = (activeSlots || []).map(slot => ({
            id: `active-${slot.id}`,
            slotId: slot.id,
            slotNumber: slot.slotNumber,
            customerId: slot.bookedByUserId,
            vehicleNumber: slot.vehicleNumber,
            entryTime: slot.entryTime,
            exitTime: null, // Still active
            isActive: true
        }));
        
        return [...historicalData, ...activeData];
    }, [allParkingHistory, activeSlots]);

    // Filter parking history based on search criteria
    const filteredHistory = React.useMemo(() => {
        if (!allParkingData) return [];
        
        let dataToFilter = allParkingData;
        
        // Filter by active sessions if requested
        if (showActiveOnly) {
            dataToFilter = dataToFilter.filter(record => record.isActive);
        }
        
        if (!searchTerm.trim()) {
            return dataToFilter.sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime));
        }

        const searchTermLower = searchTerm.toLowerCase();
        
        return dataToFilter.filter(record => {
            if (searchType === 'vehicle') {
                return record.vehicleNumber?.toLowerCase().includes(searchTermLower);
            } else if (searchType === 'customer') {
                // Search by customer name
                const user = allUsers?.find(u => u.id === record.customerId);
                const deletedUser = deletedUsers?.find(u => u.originalId === record.customerId);
                const customerName = user?.name || deletedUser?.name || 'Unknown';
                return customerName.toLowerCase().includes(searchTermLower);
            }
            return false;
        }).sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime));
    }, [allParkingData, allUsers, deletedUsers, searchTerm, searchType, showActiveOnly]);

    // Get customer name for a record
    const getCustomerName = (customerId) => {
        const user = allUsers?.find(u => u.id === customerId);
        const deletedUser = deletedUsers?.find(u => u.originalId === customerId);
        return user?.name || deletedUser?.name || 'Unknown Customer';
    };

    // Get customer type for a record
    const getCustomerType = (customerId) => {
        const user = allUsers?.find(u => u.id === customerId);
        const deletedUser = deletedUsers?.find(u => u.originalId === customerId);
        const customerType = user?.customerType || deletedUser?.customerType || 'unknown';
        return customerType === 'walk-in' ? 'Walk-in' : 'Registered';
    };

    // Calculate duration
    const calculateDuration = (entryTime, exitTime) => {
        if (!entryTime) return 'N/A';
        
        const entry = new Date(entryTime);
        const exit = exitTime ? new Date(exitTime) : currentTime; // Use current time if no exit time
        const durationMs = exit - entry;
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    };

    if (!allParkingData) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Parking History</h2>
                <p className="text-gray-500">Loading parking history...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                    Parking History ({filteredHistory.length} records)
                </h2>
                <button
                    onClick={() => setShowActiveOnly(!showActiveOnly)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                        showActiveOnly
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {showActiveOnly ? 'Show All' : 'Active Only'}
                </button>
            </div>
            
            {/* Search Controls */}
            <div className="mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={`Search by ${searchType === 'vehicle' ? 'vehicle number' : 'customer name'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="vehicle">Vehicle Number</option>
                            <option value="customer">Customer Name</option>
                        </select>
                    </div>
                </div>
                
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear search
                    </button>
                )}
            </div>

            {/* History Table */}
            <div className="overflow-x-auto max-h-96">
                {filteredHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        {searchTerm ? 'No parking records found for your search.' : 'No parking history available.'}
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Slot</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Vehicle</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Customer</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Entry</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Exit</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredHistory.map((record) => (
                                <tr key={record.id} className={`hover:bg-gray-50 ${record.isActive ? 'bg-green-50' : ''}`}>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            record.isActive 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {record.isActive ? 'Active' : 'Completed'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 font-mono text-sm">{record.slotNumber}</td>
                                    <td className="px-3 py-2 font-mono text-sm">{record.vehicleNumber}</td>
                                    <td className="px-3 py-2 text-sm">{getCustomerName(record.customerId)}</td>
                                    <td className="px-3 py-2 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            getCustomerType(record.customerId) === 'Walk-in' 
                                                ? 'bg-orange-100 text-orange-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {getCustomerType(record.customerId)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-600">
                                        {record.entryTime ? new Date(record.entryTime).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-600">
                                        {record.exitTime ? new Date(record.exitTime).toLocaleString() : 
                                         record.isActive ? <span className="text-green-600 font-medium">Ongoing</span> : 'N/A'}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-600">
                                        <span className={record.isActive ? 'text-green-600 font-medium' : ''}>
                                            {calculateDuration(record.entryTime, record.exitTime)}
                                            {record.isActive && ' (ongoing)'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ParkingHistory;
