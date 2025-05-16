const mongoose = require('mongoose');

const memoryGameResultSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  points: Number,
  time: Number,
  pairs: Number,
  playedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MemoryGameResult', memoryGameResultSchema);
