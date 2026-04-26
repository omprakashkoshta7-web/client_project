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

async function updateStoresForCurrentUser() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Common Firebase user IDs that might be used
        const possibleUserIds = [
            'firebase-vendor-user-123',
            'vendor@speedcopy.com',
            'test-vendor-123',
            'vendor-user-001',
            'speedcopy-vendor-1'
        ];

        console.log('🔍 Checking for existing vendor organizations...');
        const existingOrgs = await VendorOrg.find({}).lean();
        console.log(`Found ${existingOrgs.length} existing vendor organizations:`);
        existingOrgs.forEach(org => {
            console.log(`  - ${org.businessName} (${org.userId})`);
        });

        // Let's create stores for multiple possible user IDs
        for (const userId of possibleUserIds) {
            console.log(`\n🏢 Setting up vendor for user ID: ${userId}`);
            
            // Create or update vendor organization
            let vendorOrg = await VendorOrg.findOne({ userId });
            
            if (!vendorOrg) {
                vendorOrg = await VendorOrg.create({
                    userId: userId,
                    businessName: `SpeedCopy Business - ${userId.split('-')[0]}`,
                    gstNumber: `27${Math.random().toString(36).substr(2, 11).toUpperCase()}`,
                    contactName: 'Vendor User',
                    contactEmail: userId.includes('@') ? userId : `${userId}@speedcopy.com`,
                    contactPhone: '+91-9876543210',
                    isApproved: true,
                    isSuspended: false,
                    deletedAt: null,
                });
                console.log(`✅ Created vendor org: ${vendorOrg._id}`);
            } else {
                console.log(`✅ Vendor org already exists: ${vendorOrg._id}`);
            }

            // Create stores for this user
            const storesToCreate = [
                {
                    name: `${userId.split('-')[0]} Hub - Jabalpur`,
                    address: {
                        line1: 'Shop No. 201, Tech Plaza',
                        line2: 'Near Railway Station',
                        city: 'Jabalpur',
                        state: 'Madhya Pradesh',
                        pincode: '482001',
                    },
                    location: { lat: 23.1815, lng: 79.9864 },
                    phone: '+91-9876543210',
                    email: `jabalpur-${userId}@speedcopy.com`,
                    workingHours: '9:00 AM - 9:00 PM',
                },
                {
                    name: `${userId.split('-')[0]} Express - Bhopal`,
                    address: {
                        line1: 'Unit 25, Business Center',
                        line2: 'MP Nagar Zone 1',
                        city: 'Bhopal',
                        state: 'Madhya Pradesh',
                        pincode: '462011',
                    },
                    location: { lat: 23.2599, lng: 77.4126 },
                    phone: '+91-9876543211',
                    email: `bhopal-${userId}@speedcopy.com`,
                    workingHours: '10:00 AM - 8:00 PM',
                }
            ];

            for (const storeData of storesToCreate) {
                // Check if store already exists for this user
                const existingStore = await Store.findOne({
                    vendorId: userId,
                    name: storeData.name
                });

                if (!existingStore) {
                    const store = await Store.create({
                        vendorId: userId,
                        userId: userId,
                        name: storeData.name,
                        address: storeData.address,
                        location: storeData.location,
                        phone: storeData.phone,
                        email: storeData.email,
                        workingHours: storeData.workingHours,
                        capacity: {
                            maxOrdersPerDay: 40,
                            currentLoad: 0,
                            dailyLimit: 40,
                            maxConcurrentOrders: 10,
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
        }

        // Test API calls for each user
        console.log('\n🔍 Testing vendor stores API for each user...');
        
        for (const userId of possibleUserIds) {
            try {
                const response = await fetch('http://localhost:4010/api/vendor/stores', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.data.length > 0) {
                        console.log(`✅ User ${userId}: ${result.data.length} stores found`);
                        result.data.forEach(store => {
                            console.log(`   - ${store.name}`);
                        });
                    } else {
                        console.log(`⚠️ User ${userId}: No stores found`);
                    }
                } else {
                    console.log(`❌ User ${userId}: API error`);
                }
            } catch (error) {
                console.log(`❌ User ${userId}: Request failed`);
            }
        }

        console.log('\n🎉 Multi-user vendor stores setup complete!');
        console.log('\n📋 Instructions:');
        console.log('1. Login to vendor portal with any of these user IDs:');
        possibleUserIds.forEach(id => {
            console.log(`   - ${id}`);
        });
        console.log('2. The stores should appear in the vendor portal');
        console.log('3. If not, check which user ID is actually being used in Firebase');
        console.log('4. Update the database with the correct Firebase user ID');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up multi-user stores:', error);
        process.exit(1);
    }
}

updateStoresForCurrentUser();