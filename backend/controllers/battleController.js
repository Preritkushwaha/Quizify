const Battle = require('../models/Battle');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Create battle
exports.create = async (req, res) => {
  try {
    const { quizId } = req.body;
    const userId = req.userId;

    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User must be logged in to create a battle' });
    }

    console.log(`\n🎮 Battle Creation Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Quiz ID: ${quizId}`);

    // Verify quiz exists and belongs to user
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only battle with your own quizzes' });
    }

    // Generate unique battle code
    const battleCode = 'BT' + Date.now().toString().slice(-6).toUpperCase();

    const battle = await Battle.create({
      quizId,
      createdBy: userId,
      battleCode,
      status: 'waiting',
      participants: [
        {
          userId,
          joinedAt: new Date(),
          isAdmin: true,
        },
      ],
      maxParticipants: 4,
    });

    console.log('✅ Battle created:', battle._id, battleCode);

    res.status(201).json({
      message: 'Battle created successfully',
      battle: {
        id: battle._id,
        battleCode: battle.battleCode,
        quizId: battle.quizId,
        status: battle.status,
        participants: battle.participants.length,
      },
    });
  } catch (error) {
    console.error('❌ Create battle error:', error);
    res.status(500).json({ message: 'Error creating battle: ' + error.message });
  }
};

// Get battle by ID
exports.getById = async (req, res) => {
  try {
    const { battleId } = req.params;

    console.log(`\n🎮 Fetching Battle: ${battleId}`);

    const battle = await Battle.findOne({
      $or: [{ _id: battleId }, { battleCode: battleId }],
    }).populate('quizId', 'title questions');

    if (!battle) {
      console.log(`❌ Battle not found: ${battleId}`);
      return res.status(404).json({ message: 'Battle not found' });
    }

    console.log(`✅ Battle found:`, battle._id);
    console.log(`   Quiz ID:`, battle.quizId?._id);

    res.json({
      message: 'Battle retrieved successfully',
      battle,
    });
  } catch (error) {
    console.error('❌ Get battle error:', error);
    res.status(500).json({ message: 'Error fetching battle: ' + error.message });
  }
};

// Join battle
exports.join = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.userId;

    const battle = await Battle.findOne({
      $or: [{ _id: battleId }, { battleCode: battleId }],
    }).populate('quizId');

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    console.log(`\n🎮 Battle Join Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Battle ID: ${battleId}`);

    // Check if user already in battle
    const alreadyParticipant = battle.participants.some(p => p.userId.toString() === userId?.toString());
    if (alreadyParticipant) {
      return res.status(400).json({ message: 'You are already in this battle' });
    }

    if (battle.participants.length >= battle.maxParticipants) {
      return res.status(400).json({ message: `Real-time battle is full. Maximum ${battle.maxParticipants} participants allowed.` });
    }

    battle.participants.push({
      userId,
      joinedAt: new Date(),
      isAdmin: false,
    });

    if (battle.participants.length > 1) {
      battle.status = 'active';
    }

    await battle.save();

    console.log('✅ User joined battle:', battle._id);

    res.json({
      message: 'Successfully joined battle',
      battle,
    });
  } catch (error) {
    console.error('❌ Join battle error:', error);
    res.status(500).json({ message: 'Error joining battle' });
  }
};

// Get user battles
exports.getUserBattles = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User must be logged in' });
    }

    const battles = await Battle.find({
      $or: [
        { createdBy: userId },
        { 'participants.userId': userId },
      ],
    }).populate('quizId', 'title');

    res.json({
      message: 'Battles retrieved successfully',
      battles,
    });
  } catch (error) {
    console.error('❌ Get user battles error:', error);
    res.status(500).json({ message: 'Error fetching battles' });
  }
};
