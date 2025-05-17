const express = require('express');
const router = express.Router();
const QuizResult = require('../models/QuizResult');

router.post('/result', async (req, res) => {
  try {
    const result = await QuizResult.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: '퀴즈 저장 실패', details: err });
  }
});

module.exports = router;