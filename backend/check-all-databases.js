const mongoose = require('mongoose');

async function checkAllDatabases() {
    try {
        // Connect to the main speedcopy database
        await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log('✅ Connected to MongoDB');

        // List all collections in speedcopy database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📋 Collections in speedcopy database:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });

        // Check if there are any documents in stores collection
        const storeCollection = mongoose.connection.db.collection('stores');
        const storeCount = await storeCollection.countDocuments();
        console.log(`\n📊 Documents in stores collection: ${storeCount}`);

        if (storeCount > 0) {
            const stores = await storeCollection.find({}).toArray();
            console.log('\n📍 All stores found:');
            stores.forEach((store, index) => {
                console.log(`${index + 1}. ${store.name || 'Unnamed'}`);
                console.log(`   - ID: ${store._id}`);
                console.log(`   - VendorId: ${store.vendorId}`);
                console.log(`   - Pincode: ${store.address?.pincode || 'N/A'}`);
                console.log(`   - Active: ${store.isActive}`);
                console.log(`   - Available: ${store.isAvailable}`);
                console.log('   ---');
            });
        }

        // Check vendororgs collection
        const vendorOrgCollection = mongoose.connection.db.collection('vendororgs');
        const vendorOrgCount = await vendorOrgCollection.countDocuments();
        console.log(`\n🏢 Documents in vendororgs collection: ${vendorOrgCount}`);

        if (vendorOrgCount > 0) {
            const vendorOrgs = await vendorOrgCollection.find({}).toArray();
            console.log('\n👥 All vendor organizations found:');
            vendorOrgs.forEach((org, index) => {
                console.log(`${index + 1}. ${org.businessName || 'Unnamed'}`);
                console.log(`   - ID: ${org._id}`);
                console.log(`   - UserId: ${org.userId}`);
                console.log(`   - Approved: ${org.isApproved}`);
                console.log(`   - Suspended: ${org.isSuspended}`);
                console.log('   ---');
            });
        }

        // Also check if there's a speedcopy_vendors database
        console.log('\n🔍 Checking for speedcopy_vendors database...');
        try {
            await mongoose.disconnect();
            await mongoose.connect('mongodb://SachinDb:Sachin2003@cluster0-shard-00-00.4xnsc.mongodb.net:27017/speedcopy_vendors?ssl=true&replicaSet=atlas-v50uqc-shard-0&authSource=admin', {
                family: 4,
                serverSelectionTimeoutMS: 10000,
                maxPoolSize: 10,
            });
            console.log('✅ Connected to speedcopy_vendors database');

            const vendorCollections = await mongoose.connection.db.listCollections().toArray();
            console.log('\n📋 Collections in speedcopy_vendors database:');
            vendorCollections.forEach(col => {
                console.log(`  - ${col.name}`);
            });

            const vendorStoreCollection = mongoose.connection.db.collection('stores');
            const vendorStoreCount = await vendorStoreCollection.countDocuments();
            console.log(`\n📊 Documents in stores collection (speedcopy_vendors): ${vendorStoreCount}`);

            if (vendorStoreCount > 0) {
                const vendorStores = await vendorStoreCollection.find({}).toArray();
                console.log('\n📍 Stores in speedcopy_vendors database:');
                vendorStores.forEach((store, index) => {
                    console.log(`${index + 1}. ${store.name || 'Unnamed'}`);
                    console.log(`   - ID: ${store._id}`);
                    console.log(`   - VendorId: ${store.vendorId}`);
                    console.log(`   - Pincode: ${store.address?.pincode || 'N/A'}`);
                    console.log(`   - Active: ${store.isActive}`);
                    console.log(`   - Available: ${store.isAvailable}`);
                    console.log('   ---');
                });
            }

        } catch (vendorDbError) {
            console.log('❌ speedcopy_vendors database not found or connection failed');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAllDatabases();