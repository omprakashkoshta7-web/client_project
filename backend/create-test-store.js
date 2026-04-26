const mongoose = require('mongoose');

// Store schema matching the vendor service
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

// VendorOrg schema
const vendorOrgSchema = new mongoose.Schema({
    userId: String,
    businessName: String,
    gstNumber: String,
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    isApproved: Boolean,
    isSuspended: Boolean,
    deletedAt: Date,
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);
const VendorOrg = mongoose.model('VendorOrg', vendorOrgSchema);

async function createTestStore() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Create a test vendor organization first
        const testVendorId = 'test-vendor-123';
        
        console.log('🏢 Creating test vendor organization...');
        const vendorOrg = await VendorOrg.create({
            userId: testVendorId,
            businessName: 'SpeedCopy Test Hub',
            gstNumber: '27ABCDE1234F1Z5',
            contactName: 'Test Vendor',
            contactEmail: 'test@speedcopy.com',
            contactPhone: '+91-9876543210',
            isApproved: true,
            isSuspended: false,
            deletedAt: null,
        });
        console.log('✅ Vendor organization created:', vendorOrg._id);

        // Create test store
        console.log('🏪 Creating test store...');
        const testStore = await Store.create({
            vendorId: testVendorId,
            userId: testVendorId,
            name: 'SpeedCopy Hub - Jabalpur',
            address: {
                line1: 'Shop No. 15, Gole Market',
                line2: 'Near Railway Station',
                city: 'Jabalpur',
                state: 'Madhya Pradesh',
                pincode: '482001',
            },
            location: {
                lat: 23.1815,
                lng: 79.9864,
            },
            phone: '+91-9876543210',
            email: 'jabalpur@speedcopy.com',
            workingHours: '9:00 AM - 9:00 PM',
            capacity: {
                maxOrdersPerDay: 50,
                currentLoad: 0,
                dailyLimit: 50,
                maxConcurrentOrders: 10,
            },
            supportedFlows: ['printing', 'gifting', 'shopping'],
            isActive: true,
            isAvailable: true,
            deletedAt: null,
        });

        console.log('✅ Test store created successfully!');
        console.log('📍 Store Details:');
        console.log(`   - ID: ${testStore._id}`);
        console.log(`   - Name: ${testStore.name}`);
        console.log(`   - Pincode: ${testStore.address.pincode}`);
        console.log(`   - VendorId: ${testStore.vendorId}`);
        console.log(`   - Active: ${testStore.isActive}`);
        console.log(`   - Available: ${testStore.isAvailable}`);

        // Verify the store can be found by the API
        console.log('\n🔍 Testing store search...');
        const foundStores = await Store.aggregate([
            {
                $match: {
                    isActive: true,
                    isAvailable: true,
                    deletedAt: null,
                    'address.pincode': '482001'
                }
            },
            {
                $lookup: {
                    from: 'vendororgs',
                    localField: 'vendorId',
                    foreignField: 'userId',
                    as: 'vendorOrg',
                },
            },
            {
                $unwind: '$vendorOrg',
            },
            {
                $match: {
                    'vendorOrg.isApproved': true,
                    'vendorOrg.isSuspended': { $ne: true },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    address: 1,
                    location: 1,
                    workingHours: 1,
                    supportedFlows: 1,
                    capacity: 1,
                    isActive: 1,
                    isAvailable: 1,
                    createdAt: 1,
                },
            }
        ]);

        console.log(`✅ Found ${foundStores.length} stores in search results`);
        if (foundStores.length > 0) {
            foundStores.forEach(store => {
                console.log(`   - ${store.name} (${store.address.pincode})`);
            });
        }

        console.log('\n🎉 Test store setup complete! Now test in client:');
        console.log('1. Go to client pickup location page');
        console.log('2. Click "Near Me" or search for pincode 482001');
        console.log('3. You should see "SpeedCopy Hub - Jabalpur" in the results');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test store:', error);
        process.exit(1);
    }
}

createTestStore();