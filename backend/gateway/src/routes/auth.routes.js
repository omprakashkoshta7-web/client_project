const { Router } = require('express');
const proxy = require('express-http-proxy');
const config = require('../config');
const { authLimiter } = require('../middlewares/rate-limit');
const { authenticate } = require('../middlewares/auth');

const router = Router();

const authProxy = (extraMiddleware) => {
  const middlewares = extraMiddleware || [];
  return [
    ...middlewares,
    proxy(config.services.auth, {
      // Use originalUrl so the full path is preserved (e.g. /api/auth/verify)
      proxyReqPathResolver: (req) => req.originalUrl,
    }),
  ];
};

// Mock OTP for testing (development only)
const mockOtpStore = new Map();

router.post('/phone/send-otp', authLimiter, (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  mockOtpStore.set(phone, otp);
  
  console.log(`📱 Mock OTP for ${phone}: ${otp}`);
  
  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    phone,
    status: 'pending',
    _testOtp: otp
  });
});

router.post('/phone/verify-otp', authLimiter, (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
  }
  
  const storedOtp = mockOtpStore.get(phone);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ success: false, message: 'Invalid OTP' });
  }
  
  mockOtpStore.delete(phone);
  
  // Return mock user with correct response structure
  return res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      user: {
        _id: 'mock-user-' + phone.replace(/\D/g, ''),
        phone,
        email: phone.replace(/\D/g, '') + '@phone.speedcopy.local',
        name: 'Test User',
        role: 'user',
        isActive: true
      },
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

// POST /api/auth/verify — public
router.post('/verify', authLimiter, ...authProxy());

// GET /api/auth/me — requires JWT
router.get('/me', ...authProxy([authenticate]));

// PATCH /api/auth/users/:id/role — requires JWT (admin check done in auth-service)
router.patch('/users/:id/role', ...authProxy([authenticate]));

// PATCH /api/auth/users/:id/status — requires JWT
router.patch('/users/:id/status', ...authProxy([authenticate]));

// Fallback — catch any other /api/auth/* routes
router.use('/', ...authProxy());


/**
 * @swagger
 * tags:
 *   - name: Gateway Auth
 *     description: auth gateway routes
 *
 * /api/auth:
 *   get:
 *     summary: Base auth route
 *     tags: [Gateway Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */

module.exports = router;
