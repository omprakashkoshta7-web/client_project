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

async function createMultipleStores() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Create vendor organizations and stores
        const vendors = [
            {
                vendorId: 'vendor-bhopal-789',
                businessName: 'Digital Print Solutions',
                contactName: 'Rajesh Kumar',
                contactEmail: 'rajesh@digitalprint.com',
                contactPhone: '+91-9123456789',
                stores: [
                    {
                        name: 'Digital Print Hub - Bhopal',
                        address: {
                            line1: 'Shop 42, MP Nagar Zone 1',
                            line2: 'Near DB Mall',
                            city: 'Bhopal',
                            state: 'Madhya Pradesh',
                            pincode: '462011',
                        },
                        location: { lat: 23.2599, lng: 77.4126 },
                        phone: '+91-9123456789',
                        email: 'bhopal@digitalprint.com',
                        workingHours: '10:00 AM - 8:00 PM',
                    }
                ]
            },
            {
                vendorId: 'vendor-indore-101',
                businessName: 'Quick Print Services',
                contactName: 'Amit Sharma',
                contactEmail: 'amit@quickprint.com',
                contactPhone: '+91-9876543210',
                stores: [
                    {
                        name: 'SpeedCopy Express - Indore',
                        address: {
                            line1: 'Unit 8, Treasure Island Mall',
                            line2: 'AB Road, Vijay Nagar',
                            city: 'Indore',
                            state: 'Madhya Pradesh',
                            pincode: '452010',
                        },
                        location: { lat: 22.7196, lng: 75.8577 },
                        phone: '+91-9876543210',
                        email: 'indore@speedcopy.com',
                        workingHours: '9:00 AM - 10:00 PM',
                    }
                ]
            },
            {
                vendorId: 'vendor-jabalpur-202',
                businessName: 'Print Pro Solutions',
                contactName: 'Suresh Patel',
                contactEmail: 'suresh@printpro.com',
                contactPhone: '+91-9988776655',
                stores: [
                    {
                        name: 'Print Pro Center - Jabalpur',
                        address: {
                            line1: 'Shop 25, Civil Lines',
                            line2: 'Near High Court',
                            city: 'Jabalpur',
                            state: 'Madhya Pradesh',
                            pincode: '482001',
                        },
                        location: { lat: 23.1815, lng: 79.9864 },
                        phone: '+91-9988776655',
                        email: 'jabalpur2@printpro.com',
                        workingHours: '8:00 AM - 9:00 PM',
                    }
                ]
            }
        ];

        for (const vendor of vendors) {
            console.log(`\n🏢 Creating vendor: ${vendor.businessName}`);
            
            // Create vendor organization
            const vendorOrg = await VendorOrg.create({
                userId: vendor.vendorId,
                businessName: vendor.businessName,
                gstNumber: `27${Math.random().toString(36).substr(2, 11).toUpperCase()}`,
                contactName: vendor.contactName,
                contactEmail: vendor.contactEmail,
                contactPhone: vendor.contactPhone,
                isApproved: true,
                isSuspended: false,
                deletedAt: null,
            });
            console.log(`✅ Vendor org created: ${vendorOrg._id}`);

            // Create stores for this vendor
            for (const storeData of vendor.stores) {
                console.log(`🏪 Creating store: ${storeData.name}`);
                
                const store = await Store.create({
                    vendorId: vendor.vendorId,
                    userId: vendor.vendorId,
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
                
                console.log(`✅ Store created: ${store._id} (${store.address.pincode})`);
            }
        }

        // Test all pincodes
        console.log('\n🔍 Testing all pincode searches...');
        
        const testPincodes = ['482001', '462011', '452010'];
        
        for (const pincode of testPincodes) {
            const stores = await Store.aggregate([
                {
                    $match: {
                        isActive: true,
                        isAvailable: true,
                        deletedAt: null,
                        'address.pincode': pincode
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

            console.log(`📍 Pincode ${pincode}: Found ${stores.length} stores`);
            stores.forEach(store => {
                console.log(`   - ${store.name}`);
            });
        }

        console.log('\n🎉 All stores created successfully!');
        console.log('Test these pincodes in client pickup location:');
        console.log('- 482001 (Jabalpur) - 2 stores');
        console.log('- 462011 (Bhopal) - 1 store');
        console.log('- 452010 (Indore) - 1 store');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating stores:', error);
        process.exit(1);
    }
}

createMultipleStores();