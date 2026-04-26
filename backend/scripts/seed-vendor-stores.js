const mongoose = require('mongoose');
const Store = require('../services/vendor-service/src/models/store.model');

const sampleStores = [
    {
        vendorId: 'vendor-001',
        userId: 'user-001',
        name: 'PrintMaster Downtown',
        internalCode: 'PM-DT-001',
        address: {
            line1: 'Shop 12, Ground Floor, Metro Plaza',
            line2: 'Near Metro Station',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
        },
        location: {
            lat: 19.0760,
            lng: 72.8777,
        },
        phone: '+91 98765 43210',
        email: 'downtown@printmaster.com',
        workingHours: '9:00 AM - 9:00 PM',
        capacity: {
            maxOrdersPerDay: 100,
            currentLoad: 25,
            dailyLimit: 100,
            maxConcurrentOrders: 15,
        },
        supportedFlows: ['printing', 'gifting'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-002',
        userId: 'user-002',
        name: 'QuickPrint Andheri',
        internalCode: 'QP-AN-002',
        address: {
            line1: 'Unit 5, First Floor, Business Center',
            line2: 'Andheri West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400058',
        },
        location: {
            lat: 19.1136,
            lng: 72.8697,
        },
        phone: '+91 98765 43211',
        email: 'andheri@quickprint.com',
        workingHours: '8:00 AM - 10:00 PM',
        capacity: {
            maxOrdersPerDay: 80,
            currentLoad: 15,
            dailyLimit: 80,
            maxConcurrentOrders: 12,
        },
        supportedFlows: ['printing', 'shopping'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-003',
        userId: 'user-003',
        name: 'CopyZone Bandra',
        internalCode: 'CZ-BD-003',
        address: {
            line1: 'Shop 8, Hill Road',
            line2: 'Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
        },
        location: {
            lat: 19.0596,
            lng: 72.8295,
        },
        phone: '+91 98765 43212',
        email: 'bandra@copyzone.com',
        workingHours: '10:00 AM - 8:00 PM',
        capacity: {
            maxOrdersPerDay: 60,
            currentLoad: 10,
            dailyLimit: 60,
            maxConcurrentOrders: 8,
        },
        supportedFlows: ['printing'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-004',
        userId: 'user-004',
        name: 'Digital Print Hub',
        internalCode: 'DPH-PW-004',
        address: {
            line1: 'Office 201, Tech Tower',
            line2: 'Powai',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400076',
        },
        location: {
            lat: 19.1197,
            lng: 72.9073,
        },
        phone: '+91 98765 43213',
        email: 'powai@digitalprintHub.com',
        workingHours: '9:30 AM - 7:30 PM',
        capacity: {
            maxOrdersPerDay: 120,
            currentLoad: 30,
            dailyLimit: 120,
            maxConcurrentOrders: 20,
        },
        supportedFlows: ['printing', 'gifting', 'shopping'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-005',
        userId: 'user-005',
        name: 'Express Copy Center',
        internalCode: 'ECC-TH-005',
        address: {
            line1: 'Ground Floor, Station Complex',
            line2: 'Thane West',
            city: 'Thane',
            state: 'Maharashtra',
            pincode: '400601',
        },
        location: {
            lat: 19.2183,
            lng: 72.9781,
        },
        phone: '+91 98765 43214',
        email: 'thane@expresscopy.com',
        workingHours: '8:30 AM - 9:30 PM',
        capacity: {
            maxOrdersPerDay: 90,
            currentLoad: 20,
            dailyLimit: 90,
            maxConcurrentOrders: 15,
        },
        supportedFlows: ['printing', 'gifting'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-006',
        userId: 'user-006',
        name: 'SpeedCopy Malad',
        internalCode: 'SC-ML-006',
        address: {
            line1: 'Shop 15, Link Road',
            line2: 'Malad West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400064',
        },
        location: {
            lat: 19.1868,
            lng: 72.8347,
        },
        phone: '+91 98765 43215',
        email: 'malad@speedcopy.com',
        workingHours: '9:00 AM - 9:00 PM',
        capacity: {
            maxOrdersPerDay: 70,
            currentLoad: 18,
            dailyLimit: 70,
            maxConcurrentOrders: 10,
        },
        supportedFlows: ['printing', 'gifting'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-007',
        userId: 'user-007',
        name: 'PrintZone Borivali',
        internalCode: 'PZ-BV-007',
        address: {
            line1: 'Unit 3, Shopping Complex',
            line2: 'Borivali East',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400066',
        },
        location: {
            lat: 19.2307,
            lng: 72.8567,
        },
        phone: '+91 98765 43216',
        email: 'borivali@printzone.com',
        workingHours: '8:00 AM - 10:00 PM',
        capacity: {
            maxOrdersPerDay: 85,
            currentLoad: 22,
            dailyLimit: 85,
            maxConcurrentOrders: 12,
        },
        supportedFlows: ['printing', 'shopping'],
        isActive: true,
        isAvailable: true,
    },
    {
        vendorId: 'vendor-008',
        userId: 'user-008',
        name: 'CopyMart Kandivali',
        internalCode: 'CM-KD-008',
        address: {
            line1: 'Ground Floor, Market Plaza',
            line2: 'Kandivali West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400067',
        },
        location: {
            lat: 19.2095,
            lng: 72.8526,
        },
        phone: '+91 98765 43217',
        email: 'kandivali@copymart.com',
        workingHours: '9:30 AM - 8:30 PM',
        capacity: {
            maxOrdersPerDay: 65,
            currentLoad: 12,
            dailyLimit: 65,
            maxConcurrentOrders: 8,
        },
        supportedFlows: ['printing'],
        isActive: true,
        isAvailable: true,
    },
];

async function seedVendorStores() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speedcopy');
        console.log('Connected to MongoDB');

        // Clear existing stores
        await Store.deleteMany({});
        console.log('Cleared existing vendor stores');

        // Insert sample stores
        const insertedStores = await Store.insertMany(sampleStores);
        console.log(`Inserted ${insertedStores.length} vendor stores`);

        // Display inserted stores
        insertedStores.forEach(store => {
            console.log(`- ${store.name} (${store.address.city}, ${store.address.pincode})`);
        });

        console.log('\nVendor stores seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding vendor stores:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedVendorStores();