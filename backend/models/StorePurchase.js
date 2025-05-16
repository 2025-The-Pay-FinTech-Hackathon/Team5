const mongoose = require('mongoose');

const storePurchaseSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  itemId: String,
  itemName: String,
  points: Number,
  purchasedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StorePurchase', storePurchaseSchema);