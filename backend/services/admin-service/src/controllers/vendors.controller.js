const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendError } = require('../../../../shared/utils/response');
const { paginate, paginateMeta } = require('../../../../shared/utils/pagination');
const AuditLog = require('../models/audit-log.model');

const getAuthConn = async () => {
    const uri = process.env.AUTH_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_auth';
    const existing = mongoose.connections.find(
        (c) => c.name === 'speedcopy_auth' && c.readyState === 1
    );
    if (existing) return existing;
    return mongoose
        .createConnection(uri, { family: 4, serverSelectionTimeoutMS: 5000 })
        .asPromise();
};

const getVendorConn = async () => {
    const uri = process.env.VENDOR_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_vendors';
    const existing = mongoose.connections.find(
        (c) => c.name === 'speedcopy_vendors' && c.readyState === 1
    );
    if (existing) return existing;
    return mongoose
        .createConnection(uri, { family: 4, serverSelectionTimeoutMS: 5000 })
        .asPromise();
};

const getVendors = async (req, res, next) => {
    try {
        const conn = await getVendorConn();
        const { page, limit, skip } = paginate(req.query);
        const filter = { deletedAt: null };
        if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
        if (req.query.isSuspended !== undefined)
            filter.isSuspended = req.query.isSuspended === 'true';

        const [vendors, total] = await Promise.all([
            conn.db
                .collection('vendororgs')
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            conn.db.collection('vendororgs').countDocuments(filter),
        ]);

        return sendSuccess(res, { vendors, meta: paginateMeta(total, page, limit) });
    } catch (err) {
        next(err);
    }
};

const getVendor = async (req, res, next) => {
    try {
        const conn = await getVendorConn();
        const vendorId = new mongoose.Types.ObjectId(req.params.id);
        const [vendor, stores, staff] = await Promise.all([
            conn.db.collection('vendororgs').findOne({ _id: vendorId }),
            conn.db.collection('stores').find({ vendorId: req.params.id, deletedAt: null }).toArray(),
            conn.db.collection('vendorstaffs').find({ vendorId: req.params.id, deletedAt: null }).toArray(),
        ]);
        if (!vendor) return sendError(res, 'Vendor not found', 404);
        return sendSuccess(res, {
            ...vendor,
            stores,
            staff,
            stats: {
                totalStores: stores.length,
                activeStores: stores.filter((store) => store.isActive).length,
                activeStaff: staff.filter((member) => member.isActive).length,
            },
        });
    } catch (err) {
        next(err);
    }
};

const suspendVendor = async (req, res, next) => {
    try {
        const conn = await getVendorConn();
        const { reason, isSuspended = true } = req.body;
        await conn.db
            .collection('vendororgs')
            .updateOne(
                { _id: new mongoose.Types.ObjectId(req.params.id) },
                {
                    $set: {
                        isSuspended,
                        suspendedReason: reason,
                        updatedAt: new Date(),
                    },
                }
            );
        await AuditLog.create({
            actorId: req.headers['x-user-id'] || '',
            actorRole: req.headers['x-user-role'] || 'admin',
            action: isSuspended ? 'admin.vendors.suspend' : 'admin.vendors.resume',
            targetType: 'vendor',
            targetId: req.params.id,
            reason,
        });
        return sendSuccess(res, null, `Vendor ${isSuspended ? 'suspended' : 'resumed'}`);
    } catch (err) {
        next(err);
    }
};

const setPriority = async (req, res, next) => {
    try {
        const conn = await getVendorConn();
        const { priority } = req.body;
        await conn.db
            .collection('vendororgs')
            .updateOne(
                { _id: new mongoose.Types.ObjectId(req.params.id) },
                { $set: { priority, updatedAt: new Date() } }
            );
        await AuditLog.create({
            actorId: req.headers['x-user-id'] || '',
            actorRole: req.headers['x-user-role'] || 'admin',
            action: 'admin.vendors.priority_updated',
            targetType: 'vendor',
            targetId: req.params.id,
            metadata: { priority },
        });
        return sendSuccess(res, null, 'Priority updated');
    } catch (err) {
        next(err);
    }
};

const createVendor = async (req, res, next) => {
    try {
        const authConn = await getAuthConn();
        const conn = await getVendorConn();
        const { name, email, phone, location, tier = 'bronze', password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedPhone = String(phone || '').trim();
        const normalizedName = String(name || '').trim();

        if (!normalizedName || !normalizedEmail || !normalizedPhone) {
            return sendError(res, 'Name, email, and phone are required', 400);
        }

        const [existingAuthUser, existingVendorByEmail] = await Promise.all([
            authConn.db.collection('users').findOne({ email: normalizedEmail, deletedAt: null }),
            conn.db.collection('vendororgs').findOne({
                $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
                deletedAt: null,
            }),
        ]);

        if (existingVendorByEmail) {
            return sendError(res, 'Vendor with this email already exists', 409);
        }

        let userId = '';
        if (existingAuthUser) {
            if (existingAuthUser.role !== 'vendor') {
                return sendError(res, 'A user with this email already exists under another role', 409);
            }

            const existingVendorByUserId = await conn.db.collection('vendororgs').findOne({
                userId: String(existingAuthUser._id),
                deletedAt: null,
            });
            if (existingVendorByUserId) {
                return sendError(res, 'Vendor account already exists for this user', 409);
            }

            userId = String(existingAuthUser._id);
        } else {
            const finalPassword = password || `Vendor@${normalizedPhone.slice(-4) || '1234'}`;
            const hashedPassword = await bcrypt.hash(finalPassword, 12);
            const authUser = {
                name: normalizedName,
                email: normalizedEmail,
                phone: normalizedPhone,
                password: hashedPassword,
                role: 'vendor',
                isActive: true,
                isEmailVerified: false,
                vendorDetails: {
                    businessName: normalizedName,
                    businessAddress: location || '',
                    isApproved: true,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            const authInsertResult = await authConn.db.collection('users').insertOne(authUser);
            userId = String(authInsertResult.insertedId);
        }

        const newVendor = {
            userId,
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            businessName: normalizedName,
            contactName: normalizedName,
            contactEmail: normalizedEmail,
            contactPhone: normalizedPhone,
            location: location || '',
            address: {
                line1: location || '',
                line2: '',
                city: location || '',
                state: '',
                pincode: '',
            },
            tier,
            isApproved: true,
            isSuspended: false,
            priority: 1,
            healthScore: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        };

        const result = await conn.db.collection('vendororgs').insertOne(newVendor);

        // Create audit log (non-blocking)
        try {
            await AuditLog.create({
                actorId: req.headers['x-user-id'] || '',
                actorRole: req.headers['x-user-role'] || 'admin',
                action: 'admin.vendors.created',
                targetType: 'vendor',
                targetId: result.insertedId.toString(),
                metadata: { name: normalizedName, email: normalizedEmail, userId },
            });
        } catch (auditErr) {
            console.error('Failed to create audit log:', auditErr);
            // Don't fail the request if audit log fails
        }

        return sendSuccess(res, { ...newVendor, _id: result.insertedId }, 'Vendor created successfully', 201);
    } catch (err) {
        next(err);
    }
};

module.exports = { getVendors, getVendor, createVendor, suspendVendor, setPriority };
