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

async function testVendorStores() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speedcopy', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to MongoDB');

        // Check if there are any stores
        const totalStores = await Store.countDocuments();
        console.log(`📊 Total stores in database: ${totalStores}`);

        // Check active stores
        const activeStores = await Store.countDocuments({ isActive: true, isAvailable: true, deletedAt: null });
        console.log(`🟢 Active and available stores: ${activeStores}`);

        // Check stores by pincode
        const pincodes = ['482001', '400001', '400058', '400050', '400076', '400601'];
        for (const pincode of pincodes) {
            const storesByPincode = await Store.countDocuments({ 
                'address.pincode': pincode, 
                isActive: true, 
                isAvailable: true, 
                deletedAt: null 
            });
            console.log(`📍 Stores in pincode ${pincode}: ${storesByPincode}`);
        }

        // List all stores with their pincodes
        const allStores = await Store.find({}, 'name address.pincode isActive isAvailable deletedAt').lean();
        console.log('\n📋 All stores:');
        allStores.forEach(store => {
            console.log(`  - ${store.name} (${store.address?.pincode}) - Active: ${store.isActive}, Available: ${store.isAvailable}, Deleted: ${!!store.deletedAt}`);
        });

        // Test the search function
        console.log('\n🔍 Testing search for pincode 482001:');
        const searchResult = await Store.find({
            'address.pincode': '482001',
            isActive: true,
            isAvailable: true,
            deletedAt: null
        }).lean();
        console.log('Search result:', searchResult);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testVendorStores();