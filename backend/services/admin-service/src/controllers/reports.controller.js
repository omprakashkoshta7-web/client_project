const mongoose = require('mongoose');
const { sendSuccess } = require('../../../../shared/utils/response');
const AuditLog = require('../models/audit-log.model');

const getConn = async (dbName) => {
    const existing = mongoose.connections.find((c) => c.name === dbName && c.readyState === 1);
    if (existing) return existing;
    
    let uri;
    if (dbName === 'speedcopy_orders') {
        uri = process.env.ORDER_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_orders';
    } else if (dbName === 'speedcopy_auth') {
        uri = process.env.AUTH_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_auth';
    } else {
        uri = `mongodb://127.0.0.1:27017/${dbName}`;
    }
    
    const conn = await mongoose
        .createConnection(uri, { family: 4, serverSelectionTimeoutMS: 5000 })
        .asPromise();
    conn.name = dbName;
    return conn;
};

const getReports = async (req, res, next) => {
    try {
        const orderConn = await getConn('speedcopy_orders');
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const matchStage = Object.keys(dateFilter).length
            ? { $match: { createdAt: dateFilter } }
            : { $match: {} };

        const [revenueByDay, ordersByStatus, ordersByFlow, totalStats] = await Promise.all([
            orderConn.db
                .collection('orders')
                .aggregate([
                    matchStage,
                    { $match: { paymentStatus: 'paid' } },
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            revenue: { $sum: '$total' },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ])
                .toArray(),
            orderConn.db
                .collection('orders')
                .aggregate([matchStage, { $group: { _id: '$status', count: { $sum: 1 } } }])
                .toArray(),
            orderConn.db
                .collection('orders')
                .aggregate([
                    matchStage,
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.flowType',
                            count: { $sum: 1 },
                            revenue: { $sum: '$items.totalPrice' },
                        },
                    },
                ])
                .toArray(),
            orderConn.db
                .collection('orders')
                .aggregate([
                    matchStage,
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$total' },
                            totalOrders: { $sum: 1 },
                            paidOrders: {
                                $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
                            },
                            refundedOrders: {
                                $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
                            },
                        },
                    },
                ])
                .toArray(),
        ]);

        return sendSuccess(res, { 
            revenueByDay, 
            ordersByStatus, 
            ordersByFlow,
            totalRevenue: totalStats[0]?.totalRevenue || 0,
            totalOrders: totalStats[0]?.totalOrders || 0,
            paidOrders: totalStats[0]?.paidOrders || 0,
            refundedOrders: totalStats[0]?.refundedOrders || 0,
        });
    } catch (err) {
        next(err);
    }
};

const getAuditLogs = async (req, res, next) => {
    try {
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
        const filter = {};
        if (req.query.action) filter.action = req.query.action;
        if (req.query.actorId) filter.actorId = req.query.actorId;
        if (req.query.targetType) filter.targetType = req.query.targetType;

        const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
        return sendSuccess(res, { logs });
    } catch (err) {
        next(err);
    }
};

module.exports = { getReports, getAuditLogs };
