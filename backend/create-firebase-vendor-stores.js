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

async function createFirebaseVendorStores() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Firebase user ID that will be used in vendor portal
        // This should match the Firebase user that logs into vendor portal
        const firebaseUserId = 'firebase-vendor-user-123';
        
        console.log('🏢 Creating Firebase vendor organization...');
        
        // Check if vendor org already exists
        let vendorOrg = await VendorOrg.findOne({ userId: firebaseUserId });
        
        if (!vendorOrg) {
            vendorOrg = await VendorOrg.create({
                userId: firebaseUserId,
                businessName: 'SpeedCopy Franchise Hub',
                gstNumber: '27FIREBASE123G1H9',
                contactName: 'Firebase Vendor',
                contactEmail: 'vendor@speedcopy.com',
                contactPhone: '+91-9999999999',
                isApproved: true,
                isSuspended: false,
                deletedAt: null,
            });
            console.log('✅ New vendor organization created:', vendorOrg._id);
        } else {
            console.log('✅ Vendor organization already exists:', vendorOrg._id);
        }

        // Create stores for this Firebase vendor
        const storesToCreate = [
            {
                name: 'SpeedCopy Hub - Main Branch',
                address: {
                    line1: 'Shop No. 101, Central Plaza',
                    line2: 'Near City Mall',
                    city: 'Jabalpur',
                    state: 'Madhya Pradesh',
                    pincode: '482001',
                },
                location: { lat: 23.1815, lng: 79.9864 },
                phone: '+91-9999999999',
                email: 'main@speedcopy.com',
                workingHours: '9:00 AM - 9:00 PM',
            },
            {
                name: 'SpeedCopy Express - Bhopal',
                address: {
                    line1: 'Unit 15, New Market',
                    line2: 'MP Nagar Zone 2',
                    city: 'Bhopal',
                    state: 'Madhya Pradesh',
                    pincode: '462011',
                },
                location: { lat: 23.2599, lng: 77.4126 },
                phone: '+91-9999999998',
                email: 'bhopal@speedcopy.com',
                workingHours: '10:00 AM - 8:00 PM',
            },
            {
                name: 'SpeedCopy Pro - Indore',
                address: {
                    line1: 'Shop 22, Vijay Nagar',
                    line2: 'Near Treasure Island',
                    city: 'Indore',
                    state: 'Madhya Pradesh',
                    pincode: '452010',
                },
                location: { lat: 22.7196, lng: 75.8577 },
                phone: '+91-9999999997',
                email: 'indore@speedcopy.com',
                workingHours: '9:00 AM - 10:00 PM',
            }
        ];

        console.log('🏪 Creating stores for Firebase vendor...');
        
        for (const storeData of storesToCreate) {
            // Check if store already exists
            const existingStore = await Store.findOne({
                vendorId: firebaseUserId,
                name: storeData.name
            });

            if (!existingStore) {
                const store = await Store.create({
                    vendorId: firebaseUserId,
                    userId: firebaseUserId,
                    name: storeData.name,
                    address: storeData.address,
                    location: storeData.location,
                    phone: storeData.phone,
                    email: storeData.email,
                    workingHours: storeData.workingHours,
                    capacity: {
                        maxOrdersPerDay: 50,
                        currentLoad: 0,
                        dailyLimit: 50,
                        maxConcurrentOrders: 12,
                    },
                    supportedFlows: ['printing', 'gifting', 'shopping'],
                    isActive: true,
                    isAvailable: true,
                    deletedAt: null,
                });
                
                console.log(`✅ Store created: ${store.name} (${store.address.pincode})`);
            } else {
                console.log(`⚠️ Store already exists: ${storeData.name}`);
            }
        }

        // Test API call to get stores for this vendor
        console.log('\n🔍 Testing vendor stores API...');
        
        try {
            const response = await fetch('http://localhost:4010/api/vendor/stores', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': firebaseUserId, // Simulating vendor authentication
                },
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ API returned ${result.data.length} stores for vendor ${firebaseUserId}`);
                result.data.forEach(store => {
                    console.log(`   - ${store.name} (${store.address.pincode})`);
                });
            } else {
                const error = await response.json();
                console.error('❌ API Error:', error);
            }
        } catch (apiError) {
            console.error('❌ API Request failed:', apiError.message);
        }

        // Verify stores are also available in nearby search
        console.log('\n🔍 Testing nearby stores search...');
        const testPincodes = ['482001', '462011', '452010'];
        
        for (const pincode of testPincodes) {
            try {
                const response = await fetch(`http://localhost:4010/api/vendor/stores/nearby?pincode=${pincode}`);
                const result = await response.json();
                console.log(`📍 Pincode ${pincode}: Found ${result.data.stores.length} stores`);
            } catch (error) {
                console.error(`❌ Error testing pincode ${pincode}:`, error.message);
            }
        }

        console.log('\n🎉 Firebase vendor stores setup complete!');
        console.log('\n📋 Instructions for vendor portal:');
        console.log('1. Login to vendor portal with Firebase authentication');
        console.log('2. Use this user ID in Firebase: firebase-vendor-user-123');
        console.log('3. Or create a Firebase user and update the userId in database');
        console.log('4. The stores should now appear in vendor portal stores page');
        console.log('\n📧 Test Firebase User Details:');
        console.log('- Email: vendor@speedcopy.com');
        console.log('- User ID: firebase-vendor-user-123');
        console.log('- Business: SpeedCopy Franchise Hub');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating Firebase vendor stores:', error);
        process.exit(1);
    }
}

createFirebaseVendorStores();