const mongoose = require('mongoose');

const savingGoalSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  title: String,
  targetAmount: Number,
  currentAmount: { type: Number, default: 0 },
  deadline: Date,
});

module.exports = mongoose.model('SavingGoal', savingGoalSchema);