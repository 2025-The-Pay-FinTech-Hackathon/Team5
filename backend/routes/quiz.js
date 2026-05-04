const express = require('express');
const { createId, findChildById, updateData } = require('../storage');

const router = express.Router();

router.post('/result', (req, res) => {
  const { childId, score = 0, correctAnswers = 0, totalQuestions = 0, questions = [] } = req.body;

  if (!childId) {
    return res.status(400).json({ error: '자녀 ID가 필요합니다.' });
  }

  const result = updateData((data) => {
    const child = findChildById(data, childId);
    if (!child) return null;

    const quizResult = {
      id: createId(),
      date: new Date().toISOString().slice(0, 10),
      score: Number(score),
      correctAnswers,
      totalQuestions,
      questions,
    };

    child.points = (child.points || 0) + Number(score);
    child.quizResults = [...(child.quizResults || []), quizResult];

    return { child, quizResult };
  });

  if (!result) {
    return res.status(404).json({ error: '자녀 정보를 찾을 수 없습니다.' });
  }

  res.status(201).json(result);
});

module.exports = router;
