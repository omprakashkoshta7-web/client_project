const jwt = require('jsonwebtoken');
const config = require('../config');
const { verifyFirebaseToken } = require('../services/auth.service');

const authenticate = async (req, res, next) => {
    if (req.headers['x-user-id'] && req.headers['x-user-role']) {
        req.user = {
            id: String(req.headers['x-user-id']),
            role: req.headers['x-user-role'],
            email: req.headers['x-user-email'] || '',
            firebaseUid: req.headers['x-firebase-uid'] || undefined,
        };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No Firebase token provided' });
    }
    try {
        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            req.user = {
                id: String(decoded.id),
                role: decoded.role,
                email: decoded.email || '',
                firebaseUid: decoded.firebaseUid,
            };
            return next();
        } catch {
            // Not a legacy JWT, continue with Firebase verification.
        }

        // Only attempt Firebase verification if token looks like a Firebase ID token
        // (Firebase tokens are 3-part JWTs with specific header claims)
        // Our backend JWTs will always be verified above if the secret matches.
        // If we reach here, it's likely a Firebase token from a mobile/web client.
        const { user, decoded } = await verifyFirebaseToken(token);
        req.user = {
            id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            role: user.role,
            email: user.email,
        };
        req.firebaseUser = decoded;
        next();
    } catch (err) {
        return res.status(err.statusCode || 401).json({
            success: false,
            message: err.message || 'Invalid or expired Firebase token',
        });
    }
};

module.exports = { authenticate };
