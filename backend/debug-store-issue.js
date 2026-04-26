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

const Store = mongoose.model('Store', storeSchema);

async function debugStoreIssue() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Check all stores
        const allStores = await Store.find({}).lean();
        console.log(`\n📊 Total stores in speedcopy database: ${allStores.length}`);
        
        if (allStores.length > 0) {
            console.log('\n📋 All stores found:');
            allStores.forEach((store, index) => {
                console.log(`${index + 1}. ${store.name}`);
                console.log(`   - Pincode: ${store.address?.pincode || 'N/A'}`);
                console.log(`   - Active: ${store.isActive}`);
                console.log(`   - Available: ${store.isAvailable}`);
                console.log(`   - Deleted: ${!!store.deletedAt}`);
                console.log(`   - VendorId: ${store.vendorId}`);
                console.log(`   - UserId: ${store.userId}`);
                console.log(`   - Address: ${JSON.stringify(store.address, null, 2)}`);
                console.log('   ---');
            });
        }

        // Check specifically for pincode 482001
        console.log('\n🔍 Searching for stores with pincode 482001:');
        const stores482001 = await Store.find({
            'address.pincode': '482001'
        }).lean();
        console.log(`Found ${stores482001.length} stores with pincode 482001`);

        // Check for active and available stores with pincode 482001
        console.log('\n🟢 Searching for ACTIVE and AVAILABLE stores with pincode 482001:');
        const activeStores482001 = await Store.find({
            'address.pincode': '482001',
            isActive: true,
            isAvailable: true,
            deletedAt: null
        }).lean();
        console.log(`Found ${activeStores482001.length} active stores with pincode 482001`);
        
        if (activeStores482001.length > 0) {
            activeStores482001.forEach(store => {
                console.log(`✅ Active store: ${store.name} (${store.address.pincode})`);
            });
        }

        // Test the aggregation pipeline that the API uses
        console.log('\n🔧 Testing aggregation pipeline:');
        const pipeline = [
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
                $unwind: {
                    path: '$vendorOrg',
                    preserveNullAndEmptyArrays: true
                }
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
                    vendorOrg: 1
                },
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 20
            }
        ];

        const aggregationResult = await Store.aggregate(pipeline);
        console.log(`Aggregation result: ${aggregationResult.length} stores found`);
        
        if (aggregationResult.length > 0) {
            aggregationResult.forEach(store => {
                console.log(`📍 ${store.name} - VendorOrg: ${store.vendorOrg ? 'Found' : 'NOT FOUND'}`);
                if (store.vendorOrg) {
                    console.log(`   - VendorOrg approved: ${store.vendorOrg.isApproved}`);
                    console.log(`   - VendorOrg suspended: ${store.vendorOrg.isSuspended}`);
                }
            });
        }

        // Check VendorOrg collection
        console.log('\n👥 Checking VendorOrg collection:');
        const VendorOrg = mongoose.model('VendorOrg', new mongoose.Schema({}, { strict: false }));
        const vendorOrgs = await VendorOrg.find({}).lean();
        console.log(`Found ${vendorOrgs.length} vendor organizations`);
        
        if (vendorOrgs.length > 0) {
            vendorOrgs.forEach(org => {
                console.log(`🏢 VendorOrg: ${org.businessName || 'N/A'}`);
                console.log(`   - UserId: ${org.userId}`);
                console.log(`   - Approved: ${org.isApproved}`);
                console.log(`   - Suspended: ${org.isSuspended}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugStoreIssue();