// Challenge routes
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Create challenge (requires auth)
router.post('/create', verifyFirebaseToken, challengeController.create);

// Get user challenges (requires auth)
router.get('/user/challenges', verifyFirebaseToken, challengeController.getUserChallenges);

// Join challenge (requires auth)
router.post('/join/:challengeId', verifyFirebaseToken, challengeController.join);

// Get challenge by ID (no auth needed)
router.get('/:challengeId', challengeController.getById);

module.exports = router;
