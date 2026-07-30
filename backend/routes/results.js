// Results routes
const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/resultsController');

// Submit result
router.post('/submit', resultsController.submit);

// Get results for quiz
router.get('/quiz/:quizId', resultsController.getResults);

// Get leaderboard
router.get('/leaderboard/:quizId', resultsController.getLeaderboard);

module.exports = router;
