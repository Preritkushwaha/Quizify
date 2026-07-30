const Result = require('../models/Result');
const Quiz = require('../models/Quiz');

// Submit quiz result
exports.submit = async (req, res) => {
  try {
    const { quizId, answers, score } = req.body;
    const userId = req.userId;

    if (!quizId || !answers || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await Result.create({
      quiz: quizId,
      user: userId,
      answers,
      score,
      completedAt: new Date(),
    });

    res.status(201).json({
      message: 'Result submitted successfully',
      result,
    });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ message: 'Error submitting result' });
  }
};

// Get results
exports.getResults = async (req, res) => {
  try {
    const results = await Result.find().populate('quiz').populate('user', 'name email');
    res.json({ results });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Error fetching results' });
  }
};

// Get leaderboard for a quiz
exports.getLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const leaderboard = await Result.find({ quiz: quizId })
      .populate('user', 'name email')
      .sort({ score: -1 })
      .limit(100);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};
