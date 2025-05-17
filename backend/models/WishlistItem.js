const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  name: String,
  price: Number,
  imageUrl: String,
  purchased: { type: Boolean, default: false },
});

module.exports = mongoose.model('WishlistItem', wishlistItemSchema);
