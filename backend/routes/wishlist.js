const express = require('express');
const router = express.Router();
const WishlistItem = require('../models/WishlistItem');

router.get('/:childId', async (req, res) => {
  const items = await WishlistItem.find({ childId: req.params.childId });
  res.json(items);
});

router.post('/:childId', async (req, res) => {
  const item = await WishlistItem.create({ ...req.body, childId: req.params.childId });
  res.status(201).json(item);
});

module.exports = router;