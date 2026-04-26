/**
 * Create Premium Design Product
 * Adds a new gifting product with premium design enabled
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import models
const Product = require('../services/product-service/src/models/product.model');
const Category = require('../services/product-service/src/models/category.model');

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

const createPremiumProduct = async () => {
    try {
        // Find gifting category
        const giftingCategory = await Category.findOne({
            $or: [
                { slug: 'gifting' },
                { flowType: 'gifting' },
                { name: /gift/i }
            ],
        });

        if (!giftingCategory) {
            console.error('✗ Gifting category not found');
            console.log('Available categories:');
            const allCats = await Category.find({}).select('name slug flowType');
            allCats.forEach(cat => console.log(`  - ${cat.name} (${cat.slug}) - ${cat.flowType}`));
            process.exit(1);
        }

        console.log(`✓ Found category: ${giftingCategory.name} (${giftingCategory._id})`);

        // Check if product already exists
        const existingProduct = await Product.findOne({
            slug: 'premium-custom-mug-deluxe'
        });

        if (existingProduct) {
            console.log('⚠ Product already exists. Updating with premium design...');
            
            existingProduct.designMode = 'both';
            existingProduct.requiresDesign = true;
            existingProduct.requiresUpload = false;
            existingProduct.giftOptions = {
                materials: ['Ceramic', 'Porcelain'],
                sizes: ['11oz', '15oz'],
                colors: ['White', 'Black', 'Red', 'Blue'],
                supportsPhotoUpload: true,
                supportsNameCustomization: true,
                supportsTextCustomization: true,
                maxPhotos: 3,
                maxNameLength: 50,
                maxTextLength: 100,
                allowPremiumTemplates: true,
                allowBlankDesign: true,
                designInstructions: 'Upload your favorite photo and add custom text to create your personalized mug',
                canvas: {
                    width: 200,
                    height: 100,
                    unit: 'mm'
                }
            };

            await existingProduct.save();
            console.log('✓ Updated existing product with premium design');
            console.log(`  Product ID: ${existingProduct._id}`);
            console.log(`  Name: ${existingProduct.name}`);
            return;
        }

        // Create new premium product
        const premiumProduct = new Product({
            name: 'Premium Custom Mug Deluxe',
            slug: 'premium-custom-mug-deluxe',
            sku: 'GIFT-PREMIUM-MUG-001',
            description: 'Premium ceramic mug with custom design, photo upload, and text personalization. Perfect for gifts!',
            category: giftingCategory._id,
            flowType: 'gifting',
            basePrice: 399,
            mrp: 699,
            sale_price: 399,
            currency: 'INR',
            images: [
                'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=400&q=80',
                'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=400&q=80'
            ],
            thumbnail: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=400&q=80',
            isActive: true,
            isFeatured: true,
            
            // Premium Design Configuration
            designMode: 'both', // Shows both Premium Design and Start Design badges
            requiresDesign: true,
            requiresUpload: false,
            
            // Gift Options with Premium Design
            giftOptions: {
                materials: ['Ceramic', 'Porcelain'],
                sizes: ['11oz', '15oz'],
                colors: ['White', 'Black', 'Red', 'Blue'],
                supportsPhotoUpload: true,
                supportsNameCustomization: true,
                supportsTextCustomization: true,
                maxPhotos: 3,
                maxNameLength: 50,
                maxTextLength: 100,
                allowPremiumTemplates: true, // Enables Premium Design badge
                allowBlankDesign: true, // Enables Start Design badge
                designInstructions: 'Upload your favorite photo and add custom text to create your personalized mug',
                canvas: {
                    width: 200,
                    height: 100,
                    unit: 'mm'
                }
            },

            // Shopping fields
            stock: 100,
            in_stock: true,
            highlights: [
                'Premium ceramic material',
                'Dishwasher safe',
                'Microwave safe',
                'High-quality print',
                'Custom photo upload',
                'Personalized text'
            ],
            tags: ['mug', 'custom', 'personalized', 'gift', 'premium', 'photo'],
            badge: 'new',
            free_shipping: false,
        });

        await premiumProduct.save();

        console.log('✓ Created premium design product successfully!');
        console.log('');
        console.log('Product Details:');
        console.log(`  ID: ${premiumProduct._id}`);
        console.log(`  Name: ${premiumProduct.name}`);
        console.log(`  Slug: ${premiumProduct.slug}`);
        console.log(`  Price: ₹${premiumProduct.basePrice} (MRP: ₹${premiumProduct.mrp})`);
        console.log(`  Category: ${giftingCategory.name}`);
        console.log(`  Design Mode: ${premiumProduct.designMode}`);
        console.log(`  Premium Templates: ${premiumProduct.giftOptions.allowPremiumTemplates}`);
        console.log(`  Blank Design: ${premiumProduct.giftOptions.allowBlankDesign}`);
        console.log('');
        console.log('✨ Badges that will show:');
        console.log('  ⭐ Premium Design (Gold badge)');
        console.log('  ✏️ Start Design (Blue badge)');
        console.log('');
        console.log('🎉 View on client: http://localhost:5173/products?flow=gifting');

    } catch (error) {
        console.error('✗ Error creating product:', error.message);
        if (error.errors) {
            console.error('Validation errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

const main = async () => {
    await connectDB();
    await createPremiumProduct();
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
};

main();
