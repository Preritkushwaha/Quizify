// Quiz routes
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Generate AI quiz (requires auth)
router.post('/generate-ai', verifyFirebaseToken, quizController.generateAI);

// Create custom quiz (requires auth)
router.post('/create', verifyFirebaseToken, quizController.create);

// Get user quizzes (requires auth) - MUST come before /:id route
router.get('/user/quizzes', verifyFirebaseToken, quizController.getUserQuizzes);

// Join quiz (requires auth)
router.post('/:quizId/join', verifyFirebaseToken, quizController.joinQuiz);

// Get quiz with participants (admin only)
router.get('/:quizId/admin', verifyFirebaseToken, quizController.getQuizWithParticipants);

// Start quiz (admin only)
router.post('/:quizId/start', verifyFirebaseToken, quizController.startQuiz);

// End quiz (admin only)
router.post('/:quizId/end', verifyFirebaseToken, quizController.endQuiz);

// Get quiz by share code (no auth)
router.get('/share/:shareCode', quizController.getByShareCode);

// Get all quizzes (no auth needed)
router.get('/list', quizController.list);

// Get quiz by ID (no auth needed)
router.get('/:id', quizController.getById);

// Update quiz
router.put('/:id', quizController.update);

// Delete quiz
router.delete('/:id', quizController.delete);

module.exports = router;