const express = require('express');
const router = express.Router();
const MemoryGameResult = require('../models/MemoryGameResult');

router.post('/result', async (req, res) => {
  try {
    const result = await MemoryGameResult.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: '게임 결과 저장 실패', details: err });
  }
});

module.exports = router;