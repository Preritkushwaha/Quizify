// Battle routes
const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Create battle (requires auth)
router.post('/create', verifyFirebaseToken, battleController.create);

// Get user battles (requires auth)
router.get('/user/battles', verifyFirebaseToken, battleController.getUserBattles);

// Join battle (requires auth)
router.post('/join/:battleId', verifyFirebaseToken, battleController.join);

// Get battle by ID (no auth needed)
router.get('/:battleId', battleController.getById);

module.exports = router;
