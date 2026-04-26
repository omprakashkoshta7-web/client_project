const mongoose = require('mongoose');

/**
 * Admin service connects to each service's own database to aggregate stats.
 * Uses separate mongoose connections per database.
 */

// Create separate connections for each service DB
const connections = {};

const getConn = async (dbName) => {
    if (connections[dbName] && connections[dbName].readyState === 1) {
        return connections[dbName];
    }
    
    let uri;
    if (dbName === 'speedcopy_orders') {
        uri = process.env.ORDER_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_orders';
    } else if (dbName === 'speedcopy_auth') {
        uri = process.env.AUTH_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_auth';
    } else {
        uri = `mongodb://127.0.0.1:27017/${dbName}`;
    }
    
    const conn = await mongoose
        .createConnection(uri, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        })
        .asPromise();
    connections[dbName] = conn;
    return conn;
};

const getDashboardStats = async () => {
    const [authConn, orderConn, productConn] = await Promise.all([
        getConn('speedcopy_auth'),
        getConn('speedcopy_orders'),
        getConn('speedcopy_products'),
    ]);

    const [totalUsers, totalOrders, totalProducts, recentOrders, ordersByStatus, revenueData, pendingOrders, completedOrders, cancelledOrders, refundCount] =
        await Promise.all([
            authConn.db.collection('users').countDocuments(),
            orderConn.db.collection('orders').countDocuments(),
            productConn.db.collection('products').countDocuments({ isActive: true }),
            orderConn.db.collection('orders').find({}).sort({ createdAt: -1 }).limit(5).toArray(),
            orderConn.db
                .collection('orders')
                .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
                .toArray(),
            orderConn.db
                .collection('orders')
                .aggregate([
                    { $match: { paymentStatus: 'paid' } },
                    { $group: { _id: null, total: { $sum: '$total' } } },
                ])
                .toArray(),
            orderConn.db.collection('orders').countDocuments({ status: 'pending' }),
            orderConn.db.collection('orders').countDocuments({ status: 'delivered' }),
            orderConn.db.collection('orders').countDocuments({ status: 'cancelled' }),
            orderConn.db.collection('orders').countDocuments({ status: 'refunded' }),
        ]);

    return {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: revenueData[0]?.total || 0,
        activeVendors: totalUsers, // Placeholder - vendors count from auth service
        activeCustomers: totalUsers,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        refundCount,
        recentOrders,
        ordersByStatus: ordersByStatus.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
        }, {}),
    };
};

module.exports = { getDashboardStats };
