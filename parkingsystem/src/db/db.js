import Dexie from 'dexie';

export const db = new Dexie('parkingAppDB');

db.version(7).stores({
  users: '++id, &email, vehicleNumber, role, mobileNumber, customerType',
  parkingSlots: '++id, &slotNumber, status, bookedByUserId, vehicleNumber, entryTime',
  parkingHistory: '++id, slotId, customerId, vehicleNumber, entryTime, exitTime',
  deletedusers: '++id, originalId, name, email, vehicleNumber, mobileNumber, customerType, deletedAt,deletedBy',
});

// Seed an initial Admin user if one doesn't exist
db.on('populate', async () => {
    const userCount = await db.users.count();
    if (userCount === 0) {
        await db.users.add({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: '123456', 
            role: 'admin',
            vehicleNumber: null, 
        });
        console.log('Default admin user created: admin@parking.com / adminpassword');
    }
});