const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  parentId: String,
  balance: { type: Number, default: 0 },
  creditScore: { type: Number, default: 700 },
  points: { type: Number, default: 0 },
  missions: { type: Array, default: [] },
  savings: { type: Array, default: [] },
  ledgers: { type: Array, default: [] },
  purchases: { type: Array, default: [] },
  loans: { type: Array, default: [] },
  loanRequests: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Child', childSchema);
