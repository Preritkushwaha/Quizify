const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Participant = require('../models/Participant');
const { generateQuiz } = require('../config/gemini');
const { generateShareCode } = require('../utils/generateShareCode');

// Generate AI Quiz
exports.generateAI = async (req, res) => {
  try {
    const { topic, difficulty, numberOfQuestions, type } = req.body;
    const userId = req.userId;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const numQuestions = numberOfQuestions || 10;
    
    // Capitalize difficulty to match schema enum
    const capitalizedDifficulty = difficulty 
      ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
      : 'Medium';
    
    console.log(`\n🎯 AI Quiz Generation Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Topic: ${topic}`);
    console.log(`   Difficulty: ${capitalizedDifficulty}`);
    console.log(`   Questions: ${numQuestions}\n`);

    // Generate quiz using Gemini
    const quizData = await generateQuiz(topic, capitalizedDifficulty, numQuestions);

    if (!quizData.questions || quizData.questions.length === 0) {
      return res.status(400).json({ message: 'Failed to generate quiz questions' });
    }

    // Create quiz with generated questions
    const quiz = await Quiz.create({
      title: `${topic} Quiz`,
      description: `AI-generated quiz about ${topic} (${quizData.questions.length} questions)`,
      category: topic,
      difficulty: capitalizedDifficulty,
      type: type || 'standard',
      questions: quizData.questions.map(q => ({
        text: q.question || 'Question',
        options: q.options || ['A', 'B', 'C', 'D'],
        correctAnswer: typeof q.correct === 'number' ? q.correct : 0,
        timer: q.timer || 30
      })),
      createdBy: userId,
      isAIGenerated: true,
      shareCode: generateShareCode(),
    });

    console.log(`✅ Quiz created successfully`);
    console.log(`   ID: ${quiz._id}`);
    console.log(`   Created By: ${quiz.createdBy}`);
    console.log(`   Questions: ${quiz.questions.length}\n`);

    const response = {
      message: 'AI quiz generated successfully',
      quiz,
    };

    // Add warning if fallback was used
    if (quizData.warning) {
      response.warning = quizData.warning;
      console.warn('⚠️ ' + quizData.warning);
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Generate AI quiz error:', error);
    res.status(500).json({ message: 'Error generating quiz: ' + error.message });
  }
};

// Create quiz
exports.create = async (req, res) => {
  try {
    const { title, description, category, difficulty, questions, type } = req.body;
    const userId = req.userId;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`\n📝 Manual Quiz Creation Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Title: ${title}`);
    console.log(`   Questions: ${questions.length}\n`);

    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      type: type || 'standard',
      questions,
      createdBy: userId,
      shareCode: generateShareCode(),
    });

    console.log(`✅ Quiz created successfully`);
    console.log(`   ID: ${quiz._id}`);
    console.log(`   Created By: ${quiz.createdBy}\n`);

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz,
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Error creating quiz: ' + error.message });
  }
};

// Get all quizzes
exports.list = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'name email');
    res.json({ quizzes });
  } catch (error) {
    console.error('List quizzes error:', error);
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
};

// Get quiz by ID
exports.getById = async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log('[QUIZ_FETCH] Fetching quiz by ID:', quizId);
    const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email');
    if (!quiz) {
      console.warn('[QUIZ_FETCH] Quiz not found for ID:', quizId);
      return res.status(404).json({ message: 'Quiz not found' });
    }
    console.log('[QUIZ_FETCH] Quiz found:', quiz._id, '- Title:', quiz.title);
    res.json({ quiz });
  } catch (error) {
    console.error('[QUIZ_FETCH_ERROR]', error.message);
    res.status(500).json({ message: 'Error fetching quiz: ' + error.message });
  }
};

// Get user quizzes
exports.getUserQuizzes = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`\n📚 Fetching Quizzes for User: ${userId}`);

    const quizzes = await Quiz.find({ createdBy: userId }).populate('createdBy', 'name email');
    
    console.log(`   Found: ${quizzes.length} quizzes\n`);

    res.json({ quizzes });
  } catch (error) {
    console.error('Get user quizzes error:', error);
    res.status(500).json({ message: 'Error fetching user quizzes' });
  }
};

// Update quiz
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndUpdate(id, req.body, { new: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Error updating quiz' });
  }
};

// Delete quiz
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Error deleting quiz' });
  }
};

// Join Quiz
exports.joinQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userName, userId } = req.body;

    if (!userName) {
      return res.status(400).json({ message: 'User name is required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user limit reached (max 10 users for standard/battle)
    if (quiz.type === '1v1' && quiz.participants.length >= 2) {
      return res.status(400).json({ message: '1v1 Challenge is full. Maximum 2 users allowed.' });
    }
    
    if (quiz.participants.length >= 10) {
      return res.status(400).json({ message: 'Quiz is full. Maximum 10 users allowed.' });
    }

    // Check if user already joined
    const existingParticipant = quiz.participants.find(
      p => p.userId?.toString() === userId || p.userName === userName
    );

    if (existingParticipant) {
      return res.status(400).json({ message: 'User already joined this quiz' });
    }

    // Create participant record
    const participant = new Participant({
      quizId,
      userId,
      userName,
      score: 0,
      answers: [],
      isEarlyCompleted: false,
      waitingForQuizEnd: false
    });

    await participant.save();

    // Add participant to quiz
    quiz.participants.push({
      userId,
      userName,
      score: 0,
      answers: [],
      joinedAt: new Date()
    });

    await quiz.save();

    res.status(201).json({
      message: 'Successfully joined quiz',
      participant,
      quizStatus: quiz.status,
      totalDuration: quiz.totalDuration,
      participantsCount: quiz.participants.length
    });
  } catch (error) {
    console.error('Join quiz error:', error);
    res.status(500).json({ message: 'Error joining quiz: ' + error.message });
  }
};

// Get Quiz with Participants (for admin dashboard)
exports.getQuizWithParticipants = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Verify user is admin
    if (quiz.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only quiz creator can view this' });
    }

    // Return quiz with participants and scores
    const participantsWithScores = quiz.participants.map(p => ({
      userId: p.userId,
      userName: p.userName,
      score: p.score,
      joinedAt: p.joinedAt,
      completedAt: p.completedAt,
      timeTakenSeconds: p.timeTakenSeconds,
      isEarlyCompleted: p.isEarlyCompleted,
      answersCount: p.answers?.length || 0
    }));

    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        type: quiz.type,
        shareCode: quiz.shareCode,
        status: quiz.status,
        isAIGenerated: quiz.isAIGenerated,
        createdBy: quiz.createdBy,
        createdAt: quiz.createdAt,
        questions: quiz.questions.map(q => ({
          text: q.text,
          options: q.options,
          timer: q.timer
        }))
      },
      participants: participantsWithScores,
      status: quiz.status,
      startedAt: quiz.startedAt,
      completedAt: quiz.completedAt
    });
  } catch (error) {
    console.error('Get quiz with participants error:', error);
    res.status(500).json({ message: 'Error fetching quiz data: ' + error.message });
  }
};

// Get Quiz by Share Code
exports.getByShareCode = async (req, res) => {
  try {
    const { shareCode } = req.params;
    console.log('[QUIZ_BY_CODE] Fetching quiz by share code:', shareCode);

    const quiz = await Quiz.findOne({ shareCode });
    if (!quiz) {
      console.warn('[QUIZ_BY_CODE] Quiz not found for share code:', shareCode);
      return res.status(404).json({ message: 'Quiz not found' });
    }
    console.log('[QUIZ_BY_CODE] Quiz found:', quiz._id, '- Title:', quiz.title);

    // Return quiz without correct answers
    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        type: quiz.type,
        questions: quiz.questions.map(q => ({
          text: q.text,
          options: q.options,
          timer: q.timer
        })),
        createdBy: quiz.createdBy,
        status: quiz.status,
        startedAt: quiz.startedAt,
        totalDuration: quiz.totalDuration,
        participantsCount: quiz.participants.length
      }
    });
  } catch (error) {
    console.error('[QUIZ_BY_CODE_ERROR]', error.message);
    res.status(500).json({ message: 'Error fetching quiz: ' + error.message });
  }
};

// Start Quiz (Admin only)
exports.startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    console.log('[START_QUIZ] Request - quizId:', quizId, 'userId:', userId);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    console.log('[START_QUIZ] Quiz found - createdBy:', quiz.createdBy?.toString(), 'current userId:', userId);

    // Verify user is the quiz creator
    // Compare as strings since userId is Firebase string and createdBy is stored as string
    const quizCreatorId = quiz.createdBy?.toString() || quiz.createdBy;
    if (quizCreatorId !== userId && quizCreatorId !== userId.toString()) {
      console.warn('[START_QUIZ] Authorization failed - createdBy:', quizCreatorId, 'userId:', userId);
      return res.status(403).json({ message: 'Only quiz creator can start the quiz' });
    }

    if (quiz.status !== 'waiting') {
      return res.status(400).json({ message: 'Quiz is already started or completed' });
    }

    // Calculate total duration from questions
    const totalDuration = quiz.questions.reduce((sum, q) => sum + (q.timer || 30), 0);

    quiz.status = 'active';
    quiz.startedAt = new Date();
    quiz.totalDuration = totalDuration;

    await quiz.save();

    console.log('[START_QUIZ] Quiz started successfully - totalDuration:', totalDuration);

    res.json({
      message: 'Quiz started successfully',
      status: quiz.status,
      startedAt: quiz.startedAt,
      totalDuration: totalDuration
    });
  } catch (error) {
    console.error('[START_QUIZ_ERROR]', error.message);
    res.status(500).json({ message: 'Error starting quiz: ' + error.message });
  }
};

// End Quiz (Admin only)
exports.endQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    console.log('[END_QUIZ] Request - quizId:', quizId, 'userId:', userId);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    console.log('[END_QUIZ] Quiz found - createdBy:', quiz.createdBy?.toString(), 'current userId:', userId);

    // Verify user is the quiz creator
    // Compare as strings since userId is Firebase string and createdBy is stored as string
    const quizCreatorId = quiz.createdBy?.toString() || quiz.createdBy;
    if (quizCreatorId !== userId && quizCreatorId !== userId.toString()) {
      console.warn('[END_QUIZ] Authorization failed - createdBy:', quizCreatorId, 'userId:', userId);
      return res.status(403).json({ message: 'Only quiz creator can end the quiz' });
    }

    if (quiz.status === 'completed') {
      return res.status(400).json({ message: 'Quiz is already completed' });
    }

    quiz.status = 'completed';
    quiz.completedAt = new Date();

    await quiz.save();

    console.log('[END_QUIZ] Quiz ended successfully');

    res.json({
      message: 'Quiz ended successfully',
      status: quiz.status,
      completedAt: quiz.completedAt
    });
  } catch (error) {
    console.error('[END_QUIZ_ERROR]', error.message);
    res.status(500).json({ message: 'Error ending quiz: ' + error.message });
  }
};
