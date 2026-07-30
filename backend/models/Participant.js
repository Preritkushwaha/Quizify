const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: mongoose.Schema.Types.ObjectId,
  userName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number, // Time in seconds
    answeredAt: Date
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeTakenSeconds: Number, // Total time taken to complete quiz
  isEarlyCompleted: Boolean, // Flag to indicate if user completed early
  waitingForQuizEnd: Boolean // Flag to indicate user is waiting for quiz to end
});

module.exports = mongoose.model('Participant', participantSchema);
