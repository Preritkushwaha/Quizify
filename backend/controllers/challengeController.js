const Challenge = require('../models/Challenge');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Create challenge
exports.create = async (req, res) => {
  try {
    const { quizId } = req.body;
    const userId = req.userId;

    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User must be logged in to create a challenge' });
    }

    console.log(`\n🏆 Challenge Creation Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Quiz ID: ${quizId}`);

    // Verify quiz exists and belongs to user
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only challenge with your own quizzes' });
    }

    // Generate unique challenge code
    const challengeCode = 'CH' + Date.now().toString().slice(-6).toUpperCase();

    const challenge = await Challenge.create({
      quizId,
      createdBy: userId,
      challengeCode,
      status: 'waiting',
      participants: [userId],
    });

    console.log('✅ Challenge created:', challenge._id, challengeCode);

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: {
        id: challenge._id,
        challengeCode: challenge.challengeCode,
        quizId: challenge.quizId,
        status: challenge.status,
      },
    });
  } catch (error) {
    console.error('❌ Create challenge error:', error);
    res.status(500).json({ message: 'Error creating challenge: ' + error.message });
  }
};

// Get challenge by ID
exports.getById = async (req, res) => {
  try {
    const { challengeId } = req.params;

    console.log(`\n🏆 Fetching Challenge: ${challengeId}`);

    const challenge = await Challenge.findOne({
      $or: [{ _id: challengeId }, { challengeCode: challengeId }],
    }).populate('quizId', 'title questions');

    if (!challenge) {
      console.log(`❌ Challenge not found: ${challengeId}`);
      return res.status(404).json({ message: 'Challenge not found' });
    }

    console.log(`✅ Challenge found:`, challenge._id);
    console.log(`   Quiz ID:`, challenge.quizId?._id);

    res.json({
      message: 'Challenge retrieved successfully',
      challenge,
    });
  } catch (error) {
    console.error('❌ Get challenge error:', error);
    res.status(500).json({ message: 'Error fetching challenge: ' + error.message });
  }
};

// Join challenge
exports.join = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.userId;

    const challenge = await Challenge.findOne({
      $or: [{ _id: challengeId }, { challengeCode: challengeId }],
    }).populate('quizId');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    console.log(`\n🏆 Challenge Join Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Challenge ID: ${challengeId}`);

    if (challenge.participants.includes(userId)) {
      return res.status(400).json({ message: 'You are already in this challenge' });
    }

    if (challenge.participants.length >= 2) {
      return res.status(400).json({ message: 'Challenge is full. Maximum 2 participants allowed for 1v1 challenge.' });
    }

    challenge.participants.push(userId);
    challenge.status = challenge.participants.length === 2 ? 'active' : 'waiting';
    await challenge.save();

    console.log('✅ User joined challenge:', challenge._id);

    res.json({
      message: 'Successfully joined challenge',
      challenge,
    });
  } catch (error) {
    console.error('❌ Join challenge error:', error);
    res.status(500).json({ message: 'Error joining challenge' });
  }
};

// Get user challenges
exports.getUserChallenges = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User must be logged in' });
    }

    const challenges = await Challenge.find({
      $or: [{ createdBy: userId }, { participants: userId }],
    }).populate('quizId', 'title');

    res.json({
      message: 'Challenges retrieved successfully',
      challenges,
    });
  } catch (error) {
    console.error('❌ Get user challenges error:', error);
    res.status(500).json({ message: 'Error fetching challenges' });
  }
};
