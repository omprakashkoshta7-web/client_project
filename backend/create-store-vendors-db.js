const mongoose = require('mongoose');

// Simple store schema for testing
const storeSchema = new mongoose.Schema({
    vendorId: String,
    userId: String,
    name: String,
    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
    },
    location: {
        lat: Number,
        lng: Number,
    },
    phone: String,
    email: String,
    workingHours: String,
    capacity: {
        maxOrdersPerDay: Number,
        currentLoad: Number,
        dailyLimit: Number,
        maxConcurrentOrders: Number,
    },
    supportedFlows: [String],
    isActive: Boolean,
    isAvailable: Boolean,
    deletedAt: Date,
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);

async function createStoreInVendorsDB() {
    try {
        // Connect to the vendors database
        await mongoose.connect('mongodb://127.0.0.1:27017/speedcopy_vendors', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy_vendors database');

        // Create a test store for pincode 482001
        const testStore = {
            vendorId: 'test-vendor-001',
            userId: 'test-user-001',
            name: 'SpeedCopy Test Hub',
            address: {
                line1: 'Shanti Nagar, Damoh Naka',
                line2: 'Jabalpur, Madhya Pradesh',
                city: 'Jabalpur',
                state: 'Madhya Pradesh',
                pincode: '482001',
            },
            location: {
                lat: 23.1815,
                lng: 79.9864,
            },
            phone: '+91 98765 43218',
            email: 'jabalpur@speedcopy.com',
            workingHours: '9:00 AM - 9:00 PM',
            capacity: {
                maxOrdersPerDay: 50,
                currentLoad: 0,
                dailyLimit: 50,
                maxConcurrentOrders: 10,
            },
            supportedFlows: ['printing', 'gifting'],
            isActive: true,
            isAvailable: true,
            deletedAt: null,
        };

        const createdStore = await Store.create(testStore);
        console.log('✅ Created test store in vendors DB:', createdStore.name, 'with pincode:', createdStore.address.pincode);

        // Verify the store was created
        const foundStore = await Store.findOne({ 'address.pincode': '482001' });
        console.log('✅ Verified store exists in vendors DB:', foundStore ? foundStore.name : 'Not found');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createStoreInVendorsDB();