const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  quizId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  score: Number,
  totalQuestions: Number,
  answers: Array,
  cheatingFlags: Number,
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
