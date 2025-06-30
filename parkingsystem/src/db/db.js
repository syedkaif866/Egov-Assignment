// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('parkingAppDB');

db.version(3).stores({
  // Added mobileNumber and customerType. customerType helps differentiate walk-ins.
  users: '++id, &email, &vehicleNumber, role, mobileNumber, customerType',
  parkingSlots: '++id, slotNumber, status, bookedByUserId',
  parkingHistory: '++id, slotId, vehicleNumber, entryTime, exitTime',
});

// Seed an initial Admin user if one doesn't exist
db.on('populate', async () => {
    const userCount = await db.users.count();
    if (userCount === 0) {
        await db.users.add({
            name: 'Admin User',
            email: 'admin@gmail.com',
            // In a real app, NEVER store passwords in plain text. Hash them!
            // For this local-only project, this is acceptable for simplicity.
            password: '123456', 
            role: 'admin',
            vehicleNumber: null, // Admin doesn't have a vehicle
        });
        console.log('Default admin user created: admin@parking.com / adminpassword');
    }
});