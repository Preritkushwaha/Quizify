const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizId: mongoose.Schema.Types.ObjectId,
  question: String,
  options: [String],
  correct: Number,
  timer: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
