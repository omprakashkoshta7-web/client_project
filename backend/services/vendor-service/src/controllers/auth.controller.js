const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendError } = require('../../../../shared/utils/response');

const getAuthConn = async () => {
    const uri = process.env.AUTH_DB_URI || 'mongodb://127.0.0.1:27017/speedcopy_auth';
    const existing = mongoose.connections.find(
        (c) => c.name === 'speedcopy_auth' && c.readyState === 1
    );
    if (existing) return existing;
    return mongoose.createConnection(uri, { family: 4, serverSelectionTimeoutMS: 5000 }).asPromise();
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return sendError(res, 'Email and password required', 400);

        const conn = await getAuthConn();
        const user = await conn.db.collection('users').findOne({ email: email.toLowerCase() });

        if (!user || user.role !== 'vendor') {
            return sendError(res, 'Invalid vendor credentials', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) return sendError(res, 'Invalid vendor credentials', 401);

        if (!user.isActive) return sendError(res, 'Vendor account deactivated', 403);

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'speedcopy-dev-secret',
            { expiresIn: '7d' }
        );

        return sendSuccess(res, { user, token, mfaRequired: false });
    } catch (err) {
        next(err);
    }
};

const verifyMfa = async (req, res, next) => {
    try {
        const { otp } = req.body;
        if (!otp) return sendError(res, 'OTP required', 400);
        return sendSuccess(res, { verified: true }, 'MFA Verified');
    } catch (err) {
        next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        return sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
        next(err);
    }
};

const getSession = async (req, res, next) => {
    try {
        const vendorId = req.headers['x-user-id'];
        const conn = await getAuthConn();
        const user = await conn.db
            .collection('users')
            .findOne({ _id: new mongoose.Types.ObjectId(vendorId) });
        
        if (!user) return sendError(res, 'Session invalid', 401);
        delete user.password;

        return sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    login,
    verifyMfa,
    logout,
    getSession,
};
