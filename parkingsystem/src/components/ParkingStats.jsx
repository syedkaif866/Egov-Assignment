import React from 'react';

const ParkingStats = ({ slots }) => {
    // Calculate statistics
    const totalSlots = slots ? slots.length : 0;
    const availableSlots = slots ? slots.filter(slot => slot.status === 'available').length : 0;
    const occupiedSlots = slots ? slots.filter(slot => slot.status === 'occupied').length : 0;
    const maintenanceSlots = slots ? slots.filter(slot => slot.status === 'maintenance').length : 0;
    const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    const stats = [
        {
            title: 'Total Slots',
            value: totalSlots,
            icon: '🏢',
            bgColor: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50'
        },
        {
            title: 'Available Slots',
            value: availableSlots,
            icon: '✅',
            bgColor: 'bg-green-500',
            textColor: 'text-green-600',
            bgLight: 'bg-green-50'
        },
        {
            title: 'Occupied Slots',
            value: occupiedSlots,
            icon: '🚗',
            bgColor: 'bg-red-500',
            textColor: 'text-red-600',
            bgLight: 'bg-red-50'
        },
        {
            title: 'Occupancy Rate',
            value: `${occupancyPercentage}%`,
            icon: '📊',
            bgColor: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgLight: 'bg-purple-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className={`${stat.bgLight} rounded-lg p-6 shadow-md border border-gray-200`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                            <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                            {stat.title === 'Total Slots' && maintenanceSlots > 0 && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    {maintenanceSlots} in maintenance
                                </p>
                            )}
                        </div>
                        <div className={`${stat.bgColor} rounded-full p-3 text-white text-2xl`}>
                            {stat.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ParkingStats;
