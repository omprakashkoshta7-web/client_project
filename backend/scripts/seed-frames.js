/**
 * Seed frames/templates for gifting products
 * Run: node scripts/seed-frames.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './services/design-service/.env' });

const Design = require('../services/design-service/src/models/design.model');
const Product = require('../services/product-service/src/models/product.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/speedcopy';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedFrames = async () => {
  try {
    // Get first gifting product
    const product = await Product.findOne({ flowType: 'gifting' });
    
    if (!product) {
      console.log('❌ No gifting product found. Please create a product first.');
      process.exit(1);
    }

    console.log(`📦 Found product: ${product.name} (${product._id})`);

    // Create frame templates
    const frames = [
      {
        userId: 'system',
        productId: product._id.toString(),
        name: 'Back Cover',
        flowType: 'gifting',
        designType: 'normal',
        canvasJson: {
          version: '5.3.0',
          objects: [
            {
              type: 'rect',
              left: 100,
              top: 100,
              width: 760,
              height: 360,
              fill: '#ffffff',
              stroke: '#cccccc',
              strokeWidth: 2,
              selectable: false,
            },
          ],
          background: '#f5f5f5',
        },
        previewImage: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22960%22 height=%22560%22%3E%3Crect width=%22960%22 height=%22560%22 fill=%22%23f5f5f5%22/%3E%3Crect x=%22100%22 y=%22100%22 width=%22760%22 height=%22360%22 fill=%22%23ffffff%22 stroke=%22%23cccccc%22 stroke-width=%222%22/%3E%3Ctext x=%22480%22 y=%22280%22 text-anchor=%22middle%22 font-size=%2224%22 fill=%22%23999%22%3EBack Cover%3C/text%3E%3C/svg%3E',
        isSaved: true,
        isFinalized: false,
      },
      {
        userId: 'system',
        productId: product._id.toString(),
        name: 'Front Cover',
        flowType: 'gifting',
        designType: 'normal',
        canvasJson: {
          version: '5.3.0',
          objects: [
            {
              type: 'rect',
              left: 100,
              top: 100,
              width: 760,
              height: 360,
              fill: '#ffffff',
              stroke: '#cccccc',
              strokeWidth: 2,
              selectable: false,
            },
          ],
          background: '#f5f5f5',
        },
        previewImage: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22960%22 height=%22560%22%3E%3Crect width=%22960%22 height=%22560%22 fill=%22%23f5f5f5%22/%3E%3Crect x=%22100%22 y=%22100%22 width=%22760%22 height=%22360%22 fill=%22%23ffffff%22 stroke=%22%23cccccc%22 stroke-width=%222%22/%3E%3Ctext x=%22480%22 y=%22280%22 text-anchor=%22middle%22 font-size=%2224%22 fill=%22%23999%22%3EFront Cover%3C/text%3E%3C/svg%3E',
        isSaved: true,
        isFinalized: false,
      },
      {
        userId: 'system',
        productId: product._id.toString(),
        name: 'Inside Left',
        flowType: 'gifting',
        designType: 'normal',
        canvasJson: {
          version: '5.3.0',
          objects: [
            {
              type: 'rect',
              left: 100,
              top: 100,
              width: 760,
              height: 360,
              fill: '#ffffff',
              stroke: '#cccccc',
              strokeWidth: 2,
              selectable: false,
            },
          ],
          background: '#f5f5f5',
        },
        previewImage: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22960%22 height=%22560%22%3E%3Crect width=%22960%22 height=%22560%22 fill=%22%23f5f5f5%22/%3E%3Crect x=%22100%22 y=%22100%22 width=%22760%22 height=%22360%22 fill=%22%23ffffff%22 stroke=%22%23cccccc%22 stroke-width=%222%22/%3E%3Ctext x=%22480%22 y=%22280%22 text-anchor=%22middle%22 font-size=%2224%22 fill=%22%23999%22%3EInside Left%3C/text%3E%3C/svg%3E',
        isSaved: true,
        isFinalized: false,
      },
    ];

    // Delete existing frames for this product
    await Design.deleteMany({ productId: product._id.toString(), userId: 'system' });
    console.log('🗑️  Cleared existing frames');

    // Insert new frames
    const result = await Design.insertMany(frames);
    console.log(`✅ Created ${result.length} frames:`);
    result.forEach((frame) => {
      console.log(`   - ${frame.name} (${frame._id})`);
    });

    console.log('\n✨ Frames seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding frames:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run
connectDB().then(() => seedFrames());
