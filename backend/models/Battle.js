const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  battleCode: {
    type: String,
    unique: true,
    required: true,
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      joinedAt: Date,
      isAdmin: Boolean,
      score: { type: Number, default: 0 },
      answers: [Number],
      completedAt: Date,
    },
  ],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting',
  },
  maxParticipants: {
    type: Number,
    default: 4,
  },
  results: {
    type: Map,
    of: {
      score: Number,
      answers: [Number],
      completedAt: Date,
    },
    default: new Map(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
});

module.exports = mongoose.model('Battle', battleSchema);
