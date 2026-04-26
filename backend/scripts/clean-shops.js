/**
 * Clean up existing shops from database
 * Run: node scripts/clean-shops.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Simple shop schema for cleanup
const shopSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    email: String,
    location: {
        lat: Number,
        lng: Number,
    },
    workingHours: String,
    isActive: Boolean,
}, { timestamps: true });

const Shop = mongoose.model('Shop', shopSchema);

(async () => {
    try {
        // Use the MongoDB URI from environment or default
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/speedcopy_products';
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('🔗 Connected to MongoDB');

        // Remove all existing shops
        const result = await Shop.deleteMany({});
        console.log(`🗑️  Removed ${result.deletedCount} existing shops`);

        console.log('✅ Shop cleanup completed');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning shops:', error);
        process.exit(1);
    }
})();