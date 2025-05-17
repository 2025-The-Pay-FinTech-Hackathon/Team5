const express = require('express');
const router = express.Router();
const SavingGoal = require('../models/SavingGoal');

router.post('/', async (req, res) => {
  try {
    const goal = await SavingGoal.create(req.body);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: '저축 목표 추가 실패', details: err });
  }
});

router.put('/:childId/:goalId/deposit', async (req, res) => {
  try {
    const goal = await SavingGoal.findById(req.params.goalId);
    goal.currentAmount += req.body.amount;
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: '입금 실패', details: err });
  }
});

module.exports = router;