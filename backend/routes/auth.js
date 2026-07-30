// Authentication routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Register route (Firebase authenticated)
router.post('/register', authController.register);

// Login route (Firebase authenticated)
router.post('/login', authController.login);

// Get profile route (requires auth)
router.get('/profile', verifyFirebaseToken, authController.getProfile);

// Update profile route (requires auth)
router.put('/profile', verifyFirebaseToken, authController.updateProfile);

module.exports = router;