const express = require('express');
const router = express.Router();
const StorePurchase = require('../models/StorePurchase');

router.post('/purchase', async (req, res) => {
  try {
    const purchase = await StorePurchase.create(req.body);
    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ error: '구매 실패', details: err });
  }
});

module.exports = router;