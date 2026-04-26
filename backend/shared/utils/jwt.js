const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'speedcopy_dev_jwt_secret_change_in_production';

const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = { signToken, verifyToken };
