/**
 * Verify Gifting Category Exists
 * Creates gifting category if it doesn't exist
 * 
 * Run: node scripts/verify-gifting-category.js
 */
require('dotenv').config({
    path: require('path').join(__dirname, '../services/product-service/.env'),
});
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/speedcopy_products';

const categorySchema = new mongoose.Schema(
    {
        name: String,
        slug: String,
        description: String,
        flowType: String,
        image: String,
        isActive: { type: Boolean, default: true },
        sortOrder: Number,
    },
    { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema, 'categories');

(async () => {
    try {
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log(`\n✅ Connected: ${MONGO_URI}\n`);

        // Check if gifting category exists
        const giftingCategories = await Category.find({
            $or: [
                { flowType: 'gifting' },
                { slug: 'gifting' }
            ]
        });

        console.log('🔍 Checking for gifting categories...\n');

        if (giftingCategories.length > 0) {
            console.log(`✅ Found ${giftingCategories.length} gifting category(ies):\n`);
            giftingCategories.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.name}`);
                console.log(`   - ID: ${cat._id}`);
                console.log(`   - Slug: ${cat.slug}`);
                console.log(`   - Flow Type: ${cat.flowType}`);
                console.log(`   - Active: ${cat.isActive}`);
                console.log(`   - Description: ${cat.description || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('❌ No gifting categories found!\n');
            console.log('📝 Creating default gifting category...\n');

            const newCategory = await Category.create({
                name: 'Gifting Items',
                slug: 'gifting-items',
                flowType: 'gifting',
                description: 'Customized gift products with your own design',
                isActive: true,
                sortOrder: 2,
            });

            console.log('✅ Created gifting category:');
            console.log(`   - Name: ${newCategory.name}`);
            console.log(`   - ID: ${newCategory._id}`);
            console.log(`   - Slug: ${newCategory.slug}`);
            console.log(`   - Flow Type: ${newCategory.flowType}`);
            console.log('');
        }

        // Show all categories
        const allCategories = await Category.find({}).sort({ sortOrder: 1, name: 1 });
        console.log(`📊 Total categories in database: ${allCategories.length}\n`);
        
        console.log('All Categories:');
        allCategories.forEach((cat, index) => {
            const emoji = cat.flowType === 'gifting' ? '🎁' : 
                         cat.flowType === 'printing' ? '🖨️' : 
                         cat.flowType === 'shopping' ? '🛒' : '📦';
            console.log(`${index + 1}. ${emoji} ${cat.name} (${cat.flowType}) - ${cat.isActive ? 'Active' : 'Inactive'}`);
        });

        console.log('\n✅ Verification complete!\n');
        console.log('💡 Next steps:');
        console.log('   1. Go to Admin Panel: http://localhost:5174');
        console.log('   2. Navigate to: Catalog → Products');
        console.log('   3. Click: "Add Product"');
        console.log('   4. Select category with 🎁 emoji');
        console.log('   5. Look for purple "Premium Design Options" box\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
