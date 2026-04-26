/**
 * Add Premium Design to Gifting Product
 * Updates one product to have premium design enabled
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import models
const Product = require('../services/product-service/src/models/product.model');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/speedcopy';

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✓ Connected to MongoDB');
    } catch (error) {
        console.error('✗ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const addPremiumDesign = async () => {
    try {
        // Find first gifting product
        const product = await Product.findOne({ 
            flowType: 'gifting',
            isActive: true 
        });

        if (!product) {
            console.error('✗ No gifting product found');
            process.exit(1);
        }

        console.log(`✓ Found product: ${product.name}`);

        // Update with premium design options
        product.designMode = 'both';
        product.requiresDesign = true;
        product.requiresUpload = false;
        
        // Set gift options for premium design
        product.giftOptions = {
            allowPremiumTemplates: true,
            allowBlankDesign: true,
            supportsPhotoUpload: true,
            supportsNameCustomization: true,
            supportsTextCustomization: true,
            maxPhotos: 3,
            maxNameLength: 50,
            maxTextLength: 100,
            designInstructions: 'Upload your photo and add custom text to create your personalized gift'
        };

        await product.save();

        console.log('✓ Updated product with premium design options:');
        console.log(`  - Product: ${product.name}`);
        console.log(`  - Design Mode: ${product.designMode}`);
        console.log(`  - Premium Templates: ${product.giftOptions.allowPremiumTemplates}`);
        console.log(`  - Blank Design: ${product.giftOptions.allowBlankDesign}`);
        console.log(`  - Photo Upload: ${product.giftOptions.supportsPhotoUpload}`);
        console.log(`  - Name Customization: ${product.giftOptions.supportsNameCustomization}`);
        console.log(`  - Text Customization: ${product.giftOptions.supportsTextCustomization}`);

    } catch (error) {
        console.error('✗ Error updating product:', error.message);
        process.exit(1);
    }
};

const main = async () => {
    await connectDB();
    await addPremiumDesign();
    await mongoose.connection.close();
    console.log('✓ Done - Premium design product ready!');
};

main();
