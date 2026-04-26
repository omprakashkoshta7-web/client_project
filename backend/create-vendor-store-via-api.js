const mongoose = require('mongoose');

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

const VendorOrg = mongoose.model('VendorOrg', vendorOrgSchema);

async function createVendorAndStore() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to speedcopy database');

        // Create another vendor organization
        const vendorId = 'vendor-real-456';
        
        console.log('🏢 Creating realistic vendor organization...');
        const vendorOrg = await VendorOrg.create({
            userId: vendorId,
            businessName: 'Digital Print Solutions',
            gstNumber: '27XYZAB5678G1H9',
            contactName: 'Rajesh Kumar',
            contactEmail: 'rajesh@digitalprint.com',
            contactPhone: '+91-9123456789',
            isApproved: true,
            isSuspended: false,
            deletedAt: null,
        });
        console.log('✅ Vendor organization created:', vendorOrg._id);

        // Now create store via API call
        console.log('🏪 Creating store via API...');
        
        const storeData = {
            name: 'Digital Print Hub - Bhopal',
            address: {
                line1: 'Shop 42, MP Nagar Zone 1',
                line2: 'Near DB Mall',
                city: 'Bhopal',
                state: 'Madhya Pradesh',
                pincode: '462011',
            },
            location: {
                lat: 23.2599,
                lng: 77.4126,
            },
            phone: '+91-9123456789',
            email: 'bhopal@digitalprint.com',
            workingHours: '10:00 AM - 8:00 PM',
            capacity: {
                maxOrdersPerDay: 30,
                currentLoad: 0,
                dailyLimit: 30,
                maxConcurrentOrders: 8,
            },
            supportedFlows: ['printing', 'gifting'],
        };

        // Make API call to create store
        const response = await fetch('http://localhost:4010/api/vendor/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': vendorId, // Simulating vendor authentication
            },
            body: JSON.stringify(storeData),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Store created via API:', result.data.name);
            console.log(`   - Store ID: ${result.data._id}`);
            console.log(`   - Pincode: ${result.data.address.pincode}`);
        } else {
            const error = await response.json();
            console.error('❌ API Error:', error);
        }

        // Create one more store for different pincode
        console.log('\n🏪 Creating second store...');
        const storeData2 = {
            name: 'SpeedCopy Express - Indore',
            address: {
                line1: 'Unit 8, Treasure Island Mall',
                line2: 'AB Road, Vijay Nagar',
                city: 'Indore',
                state: 'Madhya Pradesh',
                pincode: '452010',
            },
            location: {
                lat: 22.7196,
                lng: 75.8577,
            },
            phone: '+91-9876543210',
            email: 'indore@speedcopy.com',
            workingHours: '9:00 AM - 10:00 PM',
            capacity: {
                maxOrdersPerDay: 40,
                currentLoad: 0,
                dailyLimit: 40,
                maxConcurrentOrders: 12,
            },
            supportedFlows: ['printing', 'gifting', 'shopping'],
        };

        const response2 = await fetch('http://localhost:4010/api/vendor/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': vendorId,
            },
            body: JSON.stringify(storeData2),
        });

        if (response2.ok) {
            const result2 = await response2.json();
            console.log('✅ Second store created via API:', result2.data.name);
            console.log(`   - Store ID: ${result2.data._id}`);
            console.log(`   - Pincode: ${result2.data.address.pincode}`);
        } else {
            const error2 = await response2.json();
            console.error('❌ API Error for second store:', error2);
        }

        // Test search for both pincodes
        console.log('\n🔍 Testing searches...');
        
        // Test Bhopal (462011)
        const bhopalsearch = await fetch('http://localhost:4010/api/vendor/stores/nearby?pincode=462011');
        const bhopalResult = await bhopalsearch.json();
        console.log(`📍 Bhopal (462011): Found ${bhopalResult.data.stores.length} stores`);
        
        // Test Indore (452010)
        const indoreSearch = await fetch('http://localhost:4010/api/vendor/stores/nearby?pincode=452010');
        const indoreResult = await indoreSearch.json();
        console.log(`📍 Indore (452010): Found ${indoreResult.data.stores.length} stores`);
        
        // Test Jabalpur (482001)
        const jabalpurSearch = await fetch('http://localhost:4010/api/vendor/stores/nearby?pincode=482001');
        const jabalpurResult = await jabalpurSearch.json();
        console.log(`📍 Jabalpur (482001): Found ${jabalpurResult.data.stores.length} stores`);

        console.log('\n🎉 All stores created successfully!');
        console.log('Now you can test in client with these pincodes:');
        console.log('- 482001 (Jabalpur) - SpeedCopy Hub');
        console.log('- 462011 (Bhopal) - Digital Print Hub');
        console.log('- 452010 (Indore) - SpeedCopy Express');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createVendorAndStore();