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

async function createStoresForFirebaseUser() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Firebase user ID variations for vendor@speedcopy.com
        const possibleUserIds = [
            'vendor@speedcopy.com',
            'vendor@speedcopy.com', // Email as user ID
            // Firebase UID patterns (Firebase generates random UIDs)
            'firebase-uid-vendor-001',
            'vendor-firebase-uid-123',
            // Common patterns
            'speedcopy-vendor-main',
            'vendor-main-001'
        ];

        console.log('🔍 Creating stores for Firebase user: vendor@speedcopy.com');
        console.log('Will try multiple possible user ID formats...\n');

        for (const userId of possibleUserIds) {
            console.log(`🏢 Setting up vendor for user ID: ${userId}`);
            
            // Create or update vendor organization
            let vendorOrg = await VendorOrg.findOne({ userId });
            
            if (!vendorOrg) {
                vendorOrg = await VendorOrg.create({
                    userId: userId,
                    businessName: 'SpeedCopy Main Business',
                    gstNumber: `27MAIN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    contactName: 'Main Vendor',
                    contactEmail: 'vendor@speedcopy.com',
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
                    name: 'SpeedCopy Main Hub - Jabalpur',
                    address: {
                        line1: 'Shop No. 301, Main Market',
                        line2: 'Near City Center',
                        city: 'Jabalpur',
                        state: 'Madhya Pradesh',
                        pincode: '482001',
                    },
                    location: { lat: 23.1815, lng: 79.9864 },
                    phone: '+91-9876543210',
                    email: 'jabalpur@speedcopy.com',
                    workingHours: '9:00 AM - 9:00 PM',
                },
                {
                    name: 'SpeedCopy Express - Bhopal Main',
                    address: {
                        line1: 'Unit 35, Central Plaza',
                        line2: 'MP Nagar Zone 2',
                        city: 'Bhopal',
                        state: 'Madhya Pradesh',
                        pincode: '462011',
                    },
                    location: { lat: 23.2599, lng: 77.4126 },
                    phone: '+91-9876543211',
                    email: 'bhopal@speedcopy.com',
                    workingHours: '10:00 AM - 8:00 PM',
                },
                {
                    name: 'SpeedCopy Pro - Indore Branch',
                    address: {
                        line1: 'Shop 45, Business District',
                        line2: 'Vijay Nagar Square',
                        city: 'Indore',
                        state: 'Madhya Pradesh',
                        pincode: '452010',
                    },
                    location: { lat: 22.7196, lng: 75.8577 },
                    phone: '+91-9876543212',
                    email: 'indore@speedcopy.com',
                    workingHours: '9:00 AM - 10:00 PM',
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
                            maxOrdersPerDay: 50,
                            currentLoad: 0,
                            dailyLimit: 50,
                            maxConcurrentOrders: 15,
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
            console.log(''); // Empty line for readability
        }

        // Test API calls for each user ID
        console.log('🔍 Testing vendor stores API for each user ID...\n');
        
        for (const userId of possibleUserIds) {
            try {
                const response = await fetch('http://localhost:4010/api/vendor/stores', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'x-user-role': 'vendor',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.data.length > 0) {
                        console.log(`✅ User ${userId}: ${result.data.length} stores found`);
                        result.data.forEach(store => {
                            console.log(`   - ${store.name} (${store.address.pincode})`);
                        });
                    } else {
                        console.log(`⚠️ User ${userId}: No stores found`);
                    }
                } else {
                    const error = await response.json();
                    console.log(`❌ User ${userId}: ${error.message}`);
                }
            } catch (error) {
                console.log(`❌ User ${userId}: Request failed - ${error.message}`);
            }
            console.log(''); // Empty line
        }

        console.log('🎉 Firebase vendor stores setup complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Login to vendor portal with: vendor@speedcopy.com / Vendor@123456');
        console.log('2. Open browser console (F12) and run:');
        console.log('   const session = JSON.parse(localStorage.getItem("vendor_session"));');
        console.log('   console.log("User ID:", session.userId);');
        console.log('3. If stores still don\'t show, note the actual user ID from console');
        console.log('4. Run this script again with the correct user ID');
        console.log('\n🔧 Manual Fix:');
        console.log('If needed, update database manually with correct Firebase UID');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating Firebase vendor stores:', error);
        process.exit(1);
    }
}

createStoresForFirebaseUser();